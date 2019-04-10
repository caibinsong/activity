package models

import (
	"encoding/xml"
	"io/ioutil"
	"log"
	"time"
)

type SysConfig struct {
	Host    string `xml:"host"`
	Product string `xml:"product"`
	Pwd     string `xml:"pwd"`
}

var SysCon *SysConfig
var StartTime string = ""

func LoadSysConfig() error {
	StartTime = time.Now().Format("2006-01-02 15:04:05")
	SysCon = &SysConfig{}
	modBty, err := ioutil.ReadFile("./conf/config.xml")
	if err != nil {
		log.Println(err.Error())
		return err
	}
	errxml := xml.Unmarshal(modBty, SysCon)
	if errxml != nil {
		log.Println(errxml.Error())
		return errxml
	}
	return nil
}
