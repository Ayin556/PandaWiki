package utils

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"strings"
)

// FeedItem represents a single item in any feed format
type FeedItem struct {
	Title       string
	Link        string
	Description string
	Published   string
}

// Feed represents a generic feed structure
type Feed struct {
	Title       string
	Description string
	Link        string
	Items       []FeedItem
}

// ParseFeed parses a feed URL and returns a generic Feed structure
func ParseFeed(url string) (*Feed, error) {
	// Get feed content
	content, err := HTTPGet(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get feed content: %v", err)
	}

	// Decode content
	decoded := DecodeBytes(content)
	decodedBytes := []byte(decoded)

	// Try to detect feed format and parse accordingly
	if strings.Contains(decoded, "<rss") {
		return parseRSS(decodedBytes)
	} else if strings.Contains(decoded, "<feed") {
		return parseAtom(decodedBytes)
	} else if strings.Contains(decoded, "\"version\":") {
		return parseJSONFeed(decodedBytes)
	}

	return nil, fmt.Errorf("unsupported feed format")
}

// parseRSS parses RSS format
func parseRSS(content []byte) (*Feed, error) {
	type RSSFeed struct {
		XMLName xml.Name `xml:"rss"`
		Channel struct {
			Title       string `xml:"title"`
			Description string `xml:"description"`
			Link        string `xml:"link"`
			Items       []struct {
				Title       string `xml:"title"`
				Link        string `xml:"link"`
				Description string `xml:"description"`
				PubDate     string `xml:"pubDate"`
			} `xml:"item"`
		} `xml:"channel"`
	}

	var rssFeed RSSFeed
	if err := xml.Unmarshal(content, &rssFeed); err != nil {
		return nil, fmt.Errorf("failed to parse RSS: %v", err)
	}

	feed := &Feed{
		Title:       rssFeed.Channel.Title,
		Description: rssFeed.Channel.Description,
		Link:        rssFeed.Channel.Link,
		Items:       make([]FeedItem, 0),
	}

	for _, item := range rssFeed.Channel.Items {
		feed.Items = append(feed.Items, FeedItem{
			Title:       item.Title,
			Link:        item.Link,
			Description: item.Description,
			Published:   item.PubDate,
		})
	}

	return feed, nil
}

// parseAtom parses Atom format
func parseAtom(content []byte) (*Feed, error) {
	type AtomFeed struct {
		XMLName  xml.Name `xml:"feed"`
		Title    string   `xml:"title"`
		Subtitle string   `xml:"subtitle"`
		Link     []struct {
			Href string `xml:"href,attr"`
		} `xml:"link"`
		Entries []struct {
			Title string `xml:"title"`
			Link  []struct {
				Href string `xml:"href,attr"`
			} `xml:"link"`
			Summary string `xml:"summary"`
			Updated string `xml:"updated"`
		} `xml:"entry"`
	}

	var atomFeed AtomFeed
	if err := xml.Unmarshal(content, &atomFeed); err != nil {
		return nil, fmt.Errorf("failed to parse Atom: %v", err)
	}

	feed := &Feed{
		Title:       atomFeed.Title,
		Description: atomFeed.Subtitle,
		Items:       make([]FeedItem, 0),
	}

	if len(atomFeed.Link) > 0 {
		feed.Link = atomFeed.Link[0].Href
	}

	for _, entry := range atomFeed.Entries {
		item := FeedItem{
			Title:       entry.Title,
			Description: entry.Summary,
			Published:   entry.Updated,
		}
		if len(entry.Link) > 0 {
			item.Link = entry.Link[0].Href
		}
		feed.Items = append(feed.Items, item)
	}

	return feed, nil
}

// parseJSONFeed parses JSON Feed format
func parseJSONFeed(content []byte) (*Feed, error) {
	type JSONFeed struct {
		Version     string `json:"version"`
		Title       string `json:"title"`
		Description string `json:"description"`
		HomePageURL string `json:"home_page_url"`
		Items       []struct {
			Title         string `json:"title"`
			URL           string `json:"url"`
			ContentText   string `json:"content_text"`
			DatePublished string `json:"date_published"`
		} `json:"items"`
	}

	var jsonFeed JSONFeed
	if err := json.Unmarshal(content, &jsonFeed); err != nil {
		return nil, fmt.Errorf("failed to parse JSON Feed: %v", err)
	}

	feed := &Feed{
		Title:       jsonFeed.Title,
		Description: jsonFeed.Description,
		Link:        jsonFeed.HomePageURL,
		Items:       make([]FeedItem, 0),
	}

	for _, item := range jsonFeed.Items {
		feed.Items = append(feed.Items, FeedItem{
			Title:       item.Title,
			Link:        item.URL,
			Description: item.ContentText,
			Published:   item.DatePublished,
		})
	}

	return feed, nil
}
