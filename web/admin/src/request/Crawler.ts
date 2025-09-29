/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import httpRequest, { ContentType, RequestParams } from "./httpClient";
import {
  DomainEpubResp,
  DomainPWResponse,
  DomainYuqueResp,
  PostApiV1CrawlerConfluenceParsePayload,
  PostApiV1CrawlerEpubConvertPayload,
  PostApiV1CrawlerMindocParsePayload,
  PostApiV1CrawlerSiyuanParsePayload,
  PostApiV1CrawlerWikijsParsePayload,
  PostApiV1CrawlerYuqueAnalysisExportFilePayload,
  V1ConfluenceParseResp,
  V1ConfluenceScrapeReq,
  V1ConfluenceScrapeResp,
  V1FeishuGetDocReq,
  V1FeishuGetDocResp,
  V1FeishuListCloudDocReq,
  V1FeishuListCloudDocResp,
  V1FeishuSearchWikiReq,
  V1FeishuSearchWikiResp,
  V1FeishuSpaceListReq,
  V1FeishuSpaceListResp,
  V1MindocParseResp,
  V1MindocScrapeReq,
  V1MindocScrapeResp,
  V1NotionParseReq,
  V1NotionParseResp,
  V1NotionScrapeReq,
  V1NotionScrapeResp,
  V1RssParseReq,
  V1RssParseResp,
  V1RssScrapeReq,
  V1RssScrapeResp,
  V1ScrapeReq,
  V1ScrapeResp,
  V1SitemapParseReq,
  V1SitemapParseResp,
  V1SitemapScrapeReq,
  V1SitemapScrapeResp,
  V1SiyuanParseResp,
  V1SiyuanScrapeReq,
  V1SiyuanScrapeResp,
  V1WikijsParseResp,
  V1WikijsScrapeReq,
  V1WikijsScrapeResp,
} from "./types";

/**
 * @description Parse Confluence Export File and return document list
 *
 * @tags crawler
 * @name PostApiV1CrawlerConfluenceParse
 * @summary ConfluenceParse
 * @request POST:/api/v1/crawler/confluence/parse
 * @response `200` `(DomainPWResponse & {
    data?: V1ConfluenceParseResp,

})` OK
 */

export const postApiV1CrawlerConfluenceParse = (
  data: PostApiV1CrawlerConfluenceParsePayload,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1ConfluenceParseResp;
    }
  >({
    path: `/api/v1/crawler/confluence/parse`,
    method: "POST",
    body: data,
    type: ContentType.FormData,
    format: "json",
    ...params,
  });

/**
 * @description Scrape specific Confluence documents by ID
 *
 * @tags crawler
 * @name PostApiV1CrawlerConfluenceScrape
 * @summary ConfluenceScrape
 * @request POST:/api/v1/crawler/confluence/scrape
 * @response `200` `(DomainPWResponse & {
    data?: V1ConfluenceScrapeResp,

})` OK
 */

export const postApiV1CrawlerConfluenceScrape = (
  body: V1ConfluenceScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1ConfluenceScrapeResp;
    }
  >({
    path: `/api/v1/crawler/confluence/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description EpubConvert
 *
 * @tags crawler
 * @name PostApiV1CrawlerEpubConvert
 * @summary EpubConvert
 * @request POST:/api/v1/crawler/epub/convert
 * @response `200` `(DomainPWResponse & {
    data?: DomainEpubResp,

})` OK
 */

export const postApiV1CrawlerEpubConvert = (
  data: PostApiV1CrawlerEpubConvertPayload,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: DomainEpubResp;
    }
  >({
    path: `/api/v1/crawler/epub/convert`,
    method: "POST",
    body: data,
    type: ContentType.FormData,
    format: "json",
    ...params,
  });

/**
 * @description Get Docx in Feishu Spaces
 *
 * @tags crawler
 * @name PostApiV1CrawlerFeishuGetDoc
 * @summary FeishuDoc
 * @request POST:/api/v1/crawler/feishu/get_doc
 * @response `200` `(DomainPWResponse & {
    data?: (V1FeishuGetDocResp)[],

})` OK
 */

export const postApiV1CrawlerFeishuGetDoc = (
  body: V1FeishuGetDocReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1FeishuGetDocResp[];
    }
  >({
    path: `/api/v1/crawler/feishu/get_doc`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description List Docx in Feishu Spaces
 *
 * @tags crawler
 * @name PostApiV1CrawlerFeishuListDoc
 * @summary FeishuListCloudDoc
 * @request POST:/api/v1/crawler/feishu/list_doc
 * @response `200` `(DomainPWResponse & {
    data?: (V1FeishuListCloudDocResp)[],

})` OK
 */

export const postApiV1CrawlerFeishuListDoc = (
  body: V1FeishuListCloudDocReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1FeishuListCloudDocResp[];
    }
  >({
    path: `/api/v1/crawler/feishu/list_doc`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description List All Feishu Spaces
 *
 * @tags crawler
 * @name PostApiV1CrawlerFeishuListSpaces
 * @summary FeishuListSpaces
 * @request POST:/api/v1/crawler/feishu/list_spaces
 * @response `200` `(DomainPWResponse & {
    data?: (V1FeishuSpaceListResp)[],

})` OK
 */

export const postApiV1CrawlerFeishuListSpaces = (
  body: V1FeishuSpaceListReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1FeishuSpaceListResp[];
    }
  >({
    path: `/api/v1/crawler/feishu/list_spaces`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Search Wiki in Feishu Spaces
 *
 * @tags crawler
 * @name PostApiV1CrawlerFeishuSearchWiki
 * @summary FeishuWikiSearch
 * @request POST:/api/v1/crawler/feishu/search_wiki
 * @response `200` `(DomainPWResponse & {
    data?: (V1FeishuSearchWikiResp)[],

})` OK
 */

export const postApiV1CrawlerFeishuSearchWiki = (
  body: V1FeishuSearchWikiReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1FeishuSearchWikiResp[];
    }
  >({
    path: `/api/v1/crawler/feishu/search_wiki`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Parse Mindoc Export File and return document list
 *
 * @tags crawler
 * @name PostApiV1CrawlerMindocParse
 * @summary MindocParse
 * @request POST:/api/v1/crawler/mindoc/parse
 * @response `200` `(DomainPWResponse & {
    data?: V1MindocParseResp,

})` OK
 */

export const postApiV1CrawlerMindocParse = (
  data: PostApiV1CrawlerMindocParsePayload,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1MindocParseResp;
    }
  >({
    path: `/api/v1/crawler/mindoc/parse`,
    method: "POST",
    body: data,
    type: ContentType.FormData,
    format: "json",
    ...params,
  });

/**
 * @description Scrape specific Mindoc documents by ID
 *
 * @tags crawler
 * @name PostApiV1CrawlerMindocScrape
 * @summary MindocScrape
 * @request POST:/api/v1/crawler/mindoc/scrape
 * @response `200` `(DomainPWResponse & {
    data?: V1MindocScrapeResp,

})` OK
 */

export const postApiV1CrawlerMindocScrape = (
  body: V1MindocScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1MindocScrapeResp;
    }
  >({
    path: `/api/v1/crawler/mindoc/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description NotionParse
 *
 * @tags crawler
 * @name PostApiV1CrawlerNotionParse
 * @summary NotionParse
 * @request POST:/api/v1/crawler/notion/parse
 * @response `200` `(DomainPWResponse & {
    data?: V1NotionParseResp,

})` OK
 */

export const postApiV1CrawlerNotionParse = (
  body: V1NotionParseReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1NotionParseResp;
    }
  >({
    path: `/api/v1/crawler/notion/parse`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description NotionScrape
 *
 * @tags crawler
 * @name PostApiV1CrawlerNotionScrape
 * @summary NotionScrape
 * @request POST:/api/v1/crawler/notion/scrape
 * @response `200` `(DomainPWResponse & {
    data?: (V1NotionScrapeResp)[],

})` OK
 */

export const postApiV1CrawlerNotionScrape = (
  body: V1NotionScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1NotionScrapeResp[];
    }
  >({
    path: `/api/v1/crawler/notion/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Parse RSS
 *
 * @tags crawler
 * @name PostApiV1CrawlerRssParse
 * @summary Parse RSS
 * @request POST:/api/v1/crawler/rss/parse
 * @response `200` `(DomainPWResponse & {
    data?: V1RssParseResp,

})` OK
 */

export const postApiV1CrawlerRssParse = (
  body: V1RssParseReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1RssParseResp;
    }
  >({
    path: `/api/v1/crawler/rss/parse`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description RSSScrape
 *
 * @tags crawler
 * @name PostApiV1CrawlerRssScrape
 * @summary RSSScrape
 * @request POST:/api/v1/crawler/rss/scrape
 * @response `200` `(DomainPWResponse & {
    data?: V1RssScrapeResp,

})` OK
 */

export const postApiV1CrawlerRssScrape = (
  body: V1RssScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1RssScrapeResp;
    }
  >({
    path: `/api/v1/crawler/rss/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Scrape
 *
 * @tags crawler
 * @name PostApiV1CrawlerScrape
 * @summary Scrape
 * @request POST:/api/v1/crawler/scrape
 * @response `200` `(DomainPWResponse & {
    data?: V1ScrapeResp,

})` OK
 */

export const postApiV1CrawlerScrape = (
  body: V1ScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1ScrapeResp;
    }
  >({
    path: `/api/v1/crawler/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Parse Sitemap
 *
 * @tags crawler
 * @name PostApiV1CrawlerSitemapParse
 * @summary Parse Sitemap
 * @request POST:/api/v1/crawler/sitemap/parse
 * @response `200` `(DomainPWResponse & {
    data?: V1SitemapParseResp,

})` OK
 */

export const postApiV1CrawlerSitemapParse = (
  body: V1SitemapParseReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1SitemapParseResp;
    }
  >({
    path: `/api/v1/crawler/sitemap/parse`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description SitemapScrape
 *
 * @tags crawler
 * @name PostApiV1CrawlerSitemapScrape
 * @summary SitemapScrape
 * @request POST:/api/v1/crawler/sitemap/scrape
 * @response `200` `(DomainPWResponse & {
    data?: V1SitemapScrapeResp,

})` OK
 */

export const postApiV1CrawlerSitemapScrape = (
  body: V1SitemapScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1SitemapScrapeResp;
    }
  >({
    path: `/api/v1/crawler/sitemap/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Parse Siyuan Export File and return document list
 *
 * @tags crawler
 * @name PostApiV1CrawlerSiyuanParse
 * @summary SiyuanParse
 * @request POST:/api/v1/crawler/siyuan/parse
 * @response `200` `(DomainPWResponse & {
    data?: V1SiyuanParseResp,

})` OK
 */

export const postApiV1CrawlerSiyuanParse = (
  data: PostApiV1CrawlerSiyuanParsePayload,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1SiyuanParseResp;
    }
  >({
    path: `/api/v1/crawler/siyuan/parse`,
    method: "POST",
    body: data,
    type: ContentType.FormData,
    format: "json",
    ...params,
  });

/**
 * @description Scrape specific Siyuan documents by ID
 *
 * @tags crawler
 * @name PostApiV1CrawlerSiyuanScrape
 * @summary SiyuanScrape
 * @request POST:/api/v1/crawler/siyuan/scrape
 * @response `200` `(DomainPWResponse & {
    data?: V1SiyuanScrapeResp,

})` OK
 */

export const postApiV1CrawlerSiyuanScrape = (
  body: V1SiyuanScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1SiyuanScrapeResp;
    }
  >({
    path: `/api/v1/crawler/siyuan/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Parse Wikijs Export File and return document list
 *
 * @tags crawler
 * @name PostApiV1CrawlerWikijsParse
 * @summary WikijsParse
 * @request POST:/api/v1/crawler/wikijs/parse
 * @response `200` `(DomainPWResponse & {
    data?: V1WikijsParseResp,

})` OK
 */

export const postApiV1CrawlerWikijsParse = (
  data: PostApiV1CrawlerWikijsParsePayload,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1WikijsParseResp;
    }
  >({
    path: `/api/v1/crawler/wikijs/parse`,
    method: "POST",
    body: data,
    type: ContentType.FormData,
    format: "json",
    ...params,
  });

/**
 * @description Scrape specific Wikijs documents by ID
 *
 * @tags crawler
 * @name PostApiV1CrawlerWikijsScrape
 * @summary WikijsScrape
 * @request POST:/api/v1/crawler/wikijs/scrape
 * @response `200` `(DomainPWResponse & {
    data?: V1WikijsScrapeResp,

})` OK
 */

export const postApiV1CrawlerWikijsScrape = (
  body: V1WikijsScrapeReq,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: V1WikijsScrapeResp;
    }
  >({
    path: `/api/v1/crawler/wikijs/scrape`,
    method: "POST",
    body: body,
    type: ContentType.Json,
    format: "json",
    ...params,
  });

/**
 * @description Analyze Yuque Export File
 *
 * @tags crawler
 * @name PostApiV1CrawlerYuqueAnalysisExportFile
 * @summary AnalysisYuqueExportFile
 * @request POST:/api/v1/crawler/yuque/analysis_export_file
 * @response `200` `(DomainPWResponse & {
    data?: (DomainYuqueResp)[],

})` OK
 */

export const postApiV1CrawlerYuqueAnalysisExportFile = (
  data: PostApiV1CrawlerYuqueAnalysisExportFilePayload,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: DomainYuqueResp[];
    }
  >({
    path: `/api/v1/crawler/yuque/analysis_export_file`,
    method: "POST",
    body: data,
    type: ContentType.FormData,
    format: "json",
    ...params,
  });
