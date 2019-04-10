package models

import (
	"fmt"
	"github.com/astaxie/beego"
	"strconv"
	"strings"
	"time"
)

type ST_KeyValue struct {
	Key   interface{}
	Value interface{}
}

var bq map[string]string = map[string]string{
	"[爱心]":  "爱心.gif",
	"[闭嘴]":  "闭嘴.gif",
	"[呲牙]":  "呲牙.gif",
	"[大哭]":  "大哭.gif",
	"[大笑]":  "大笑.gif",
	"[蛋糕]":  "蛋糕.gif",
	"[得意]":  "得意.gif",
	"[发怒]":  "发怒.gif",
	"[饭]":   "饭.gif",
	"[奋斗]":  "奋斗.gif",
	"[尴尬]":  "尴尬.gif",
	"[害羞]":  "害羞.gif",
	"[坏笑]":  "坏笑.gif",
	"[奸笑]":  "奸笑.gif",
	"[可怜]":  "可怜.gif",
	"[酷]":   "酷.gif",
	"[快哭了]": "快哭了.gif",
	"[流泪]":  "流泪.gif",
	"[玫瑰]":  "玫瑰.gif",
	"[难过]":  "难过.gif",
	"[撇嘴]":  "撇嘴.gif",
	"[强]":   "强.gif",
	"[色]":   "色.gif",
	"[胜利]":  "胜利.gif",
	"[衰]":   "衰.gif",
	"[调皮]":  "调皮.gif",
	"[偷笑]":  "偷笑.gif",
	"[微笑]":  "微笑.gif",
	"[委屈]":  "委屈.gif",
	"[握手]":  "握手.gif",
	"[心碎]":  "心碎.gif",
	"[拥抱]":  "拥抱.gif",
	"[悠闲]":  "悠闲.gif",
	"[右哼哼]": "右哼哼.gif",
	"[愉快]":  "愉快.gif",
	"[晕]":   "晕.gif",
	"[再见]":  "再见.gif",
	"[左哼哼]": "左哼哼.gif"}

//加载模板函数
func RegistFuncMap() {
	//类型转换函数
	beego.AddFuncMap("toString", toString)
	beego.AddFuncMap("toInt", toInt)
	//两个int相加相减
	beego.AddFuncMap("add", add)
	beego.AddFuncMap("dec", dec)
	beego.AddFuncMap("model", model)
	beego.AddFuncMap("lenghts", lenghts)
	beego.AddFuncMap("Length", Length)
	//判断两个对象是否相等，全部转换为字符串比较
	beego.AddFuncMap("isEqual", isEqual)
	beego.AddFuncMap("isNotEqual", isNotEqual)
	beego.AddFuncMap("hasSubString", hasSubString)
	beego.AddFuncMap("setpagebtn", setpagebtn)
	beego.AddFuncMap("ywsubString", ywsubString)
	beego.AddFuncMap("ywsubStringForlen", ywsubStringForlen)
	beego.AddFuncMap("addStr", addStr)
	beego.AddFuncMap("signstatus", signstatus)

	beego.AddFuncMap("IsPermissions1", IsPermissions1)
	beego.AddFuncMap("IsPermissions2", IsPermissions2)
	beego.AddFuncMap("IsPermissions3", IsPermissions3)

	beego.AddFuncMap("RN", RN)
	beego.AddFuncMap("BQ", BQ)
	beego.AddFuncMap("BQList", BQList)

	beego.AddFuncMap("DateSpF", DateSpF)
	beego.AddFuncMap("DateSpS", DateSpS)
	beego.AddFuncMap("TimeUnix", TimeUnix)
}

func TimeUnix() string {
	return fmt.Sprint(time.Now().Unix())
}

func Length(i []map[string]string) int {
	return len(i)
}
func BQList() []map[string]string {
	list := make([]map[string]string, 0)
	for k, v := range bq {
		add := make(map[string]string)
		add["z"] = k
		add["p"] = v
		list = append(list, add)
	}
	return list
}

func DateSpF(s string) string {
	arr := strings.Split(s, "至")
	if len(arr) == 2 {
		return strings.Replace(arr[0], " ", "T", 1)
	}
	return ""
}
func DateSpS(s string) string {
	arr := strings.Split(s, "至")
	if len(arr) == 2 {
		return strings.Replace(arr[1], " ", "T", 1)
	}
	return ""
}
func BQ(s string) string {
	for k, v := range bq {
		s = strings.Replace(s, k, fmt.Sprintf(`<img src="/img/%s"/>`, v), -1)
	}
	return s
}
func RN(s string) string {
	s = strings.Replace(s, " ", "&nbsp;", -1)
	return strings.Replace(s, "\n", "<br>", -1)
}

func IsPermissions1(p string) bool {
	if p != "" && p != "0" {
		return true
	} else {
		return false
	}
}
func IsPermissions2(p string) bool {
	if p != "" && p != "0" && p != "1" {
		return true
	} else {
		return false
	}
}
func IsPermissions3(p string) bool {
	if p != "" && p != "0" && p != "1" && p != "2" {
		return true
	} else {
		return false
	}
}

func signstatus(num string) string {
	if num == "-1" {
		return "未签到"
	} else if num == "0" {
		return "<span style='color:red'>迟到</span>"
	} else {
		return "<span style='color:green'>正常签到</span>"
	}
}

func setpagebtn(pagecount, pageindex int, str1, str2 string) string {
	rtnstr := ""
	if pagecount <= 10 {
		for i := 1; i <= pagecount; i++ {
			if i == pageindex {
				rtnstr += strings.Replace(str2, "$$$", strconv.Itoa(i), -1)
			} else {
				rtnstr += strings.Replace(str1, "$$$", strconv.Itoa(i), -1)
			}
		}
	} else {
		start := 1
		if pageindex-5 > 1 {
			start = pageindex - 5
		}
		end := pagecount
		if pageindex+5 < pagecount {
			if start+9 < pagecount {
				end = start + 10
			}
		}
		if start == 2 {
			rtnstr = strings.Replace(str1, "$$$", "1", -1)
		}
		if start > 2 {
			rtnstr = strings.Replace(str1, "$$$", "1", -1) + "&nbsp;...&nbsp;"
		}
		for i := start; i <= end; i++ {
			if i == pageindex {
				rtnstr += strings.Replace(str2, "$$$", strconv.Itoa(i), -1)
			} else {
				rtnstr += strings.Replace(str1, "$$$", strconv.Itoa(i), -1)
			}
		}
		if end == pagecount-1 {
			rtnstr += strings.Replace(str1, "$$$", strconv.Itoa(pagecount), -1)
		}
		if end <= pagecount-2 {
			rtnstr += "&nbsp;...&nbsp;" + strings.Replace(str1, "$$$", strconv.Itoa(pagecount), -1)
		}
	}
	return rtnstr
}

func toString(i interface{}) string {
	if i == nil {
		return ""
	}
	return fmt.Sprint(i)
}

func toInt(i interface{}) int {
	if i == nil {
		return 0
	}
	s := fmt.Sprint(i)
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

func add(a, b int) int {
	return a + b
}

func dec(a, b int) int {
	return a - b
}

func model(a, b int) int {
	return a % b
}

func lenghts(i interface{}) int {
	if i == nil {
		return 0
	}
	s := fmt.Sprint(i)
	return len(s)
}

//比较两个类型是否相等，全部转换为字符串比较
func isEqual(s1 interface{}, s2 interface{}) bool {
	a1 := fmt.Sprint(s1)
	a2 := fmt.Sprint(s2)
	return a1 == a2
}
func isNotEqual(s1 interface{}, s2 interface{}) bool {
	a1 := fmt.Sprint(s1)
	a2 := fmt.Sprint(s2)
	return a1 != a2
}

//在一个字符串中查找另一个字符串
func hasSubString(s, sep string) bool {
	if strings.Index(s, sep) != -1 {
		return true
	}
	return false
}

func ywsubString(s, sep string) string {
	if strings.Index(s, sep) != -1 {
		return s[:strings.Index(s, sep)]
	}
	return s
}

func ywsubStringForlen(str string, lens int) string {
	index := 0
	i := 0
	for _, v := range str {
		if v > 127 {
			i = i + 3
			index = index + 2
		} else {
			i = i + 1
			index++
		}
		if index >= lens {
			index++
			break
		}

	}
	if i > len(str) {
		return str
	}
	if str[:i] == str {
		return str[:i]
	} else {
		return str[:i] + "..."
	}
}

func addStr(str0, str1 interface{}) string {
	return fmt.Sprint(str0) + fmt.Sprint(str1)
}
