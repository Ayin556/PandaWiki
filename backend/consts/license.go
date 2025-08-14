package consts

import (
	"github.com/labstack/echo/v4"
)

type LicenseEdition int32

const (
	LicenseEditionFree        LicenseEdition = 0
	LicenseEditionContributor LicenseEdition = 1
	LicenseEditionEnterprise  LicenseEdition = 2
)

func GetLicenseEdition(c echo.Context) LicenseEdition {
	edition, _ := c.Get("edition").(LicenseEdition)
	return edition
}
