package controllers

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"github.com/astaxie/beego"
	"strconv"
	"strings"
	"time"
)

type ywcontroller struct {
	beego.Controller
}

//获得返回结果的JSON字符串
type st_json_normal_data struct {
	Status int         `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"datalist"`
}

var (
	ImgExt = []string{"jpg", "gif", "png", "jpeg", "bmp", ""}
)

func (this *ywcontroller) GetPermissions() string {
	p := this.GetSession("permissions")
	if p == nil {
		return ""
	} else {
		return p.(string)
	}
}

func (this *ywcontroller) IsImgExt(ext string) bool {
	for _, oneimg := range ImgExt {
		if strings.ToLower(ext) == oneimg {
			return false
		}
	}
	return true
}

//获得当前时间
func (this *ywcontroller) GetDateTime() string {
	return time.Now().Format("2006-01-02 15:04:05")
}
func (this *ywcontroller) GetDateTimeStr() string {
	return time.Now().Format("20060102150405")
}

//获得传入的参数，转换为int
func (this *ywcontroller) GetParamAsInt(key string) int {
	num, err := strconv.Atoi(this.GetString(key))
	if err != nil {
		return 0
	}
	return num
}

/*
输出一个对象
*/
func (this *ywcontroller) ReturnJsonString(status int, msg string, data interface{}) {
	this.Ctx.WriteString(this.jsonString(status, msg, data))
}

//获得当前传入的string参数
func (this *ywcontroller) GetParamAsString(key string) string {
	return this.GetString(key)
}

//获得当前传入的参数，防止sql注入，替换一些字符
func (this *ywcontroller) GetParamAsSqlString(key string) string {
	val := strings.Replace(this.GetString(key), "'", "''", -1)
	return val
}

//判断是不是数
func (this *ywcontroller) Is_Number(num string) bool {
	if _, err := strconv.Atoi(num); err != nil {
		return false
	}
	return true
}

//转换为数字
func (this *ywcontroller) toInt(val interface{}) int {
	num, err := strconv.Atoi(fmt.Sprint(val))
	if err != nil {
		return 0
	}
	return num
}

/*
输出一个对象
*/
func (this *ywcontroller) ReturnString(args ...interface{}) {
	this.Ctx.WriteString(fmt.Sprint(args...))
}

/*
返回json字符串
输入 status 返回状态, msg 返回信息, data 数据
输出 转换成json字符串 {Status: status, Msg: msg, Data: ""}
*/
func (this *ywcontroller) jsonString(status int, msg string, data interface{}) string {
	s := &st_json_normal_data{Status: status, Msg: msg}
	if data == nil {
		s.Data = ""
	} else {
		s.Data = data
	}
	bt, _ := json.Marshal(s)
	return string(bt)
}

//MD5值
func (this *ywcontroller) md5Value(s string) string {
	h := md5.New()
	h.Write([]byte(s))
	return fmt.Sprintf("%x", h.Sum(nil))
}

//sws的变种MD5
func (this *ywcontroller) SWSMD5(str string) string {
	str = this.md5Value(str)
	if len(str) > 8 {
		str = str[:3] + "a" + str[3:]
		str = str[:5] + "z" + str[5:]
	}
	return strings.ToUpper(str)
}
