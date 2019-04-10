package models

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

func Work() {
	go InitProduct()
	go DelExportExcel()
	//go GetWXMaterialWork()
}

func DelExportExcel() {
	for {
		filepath.Walk("./export", func(path string, info os.FileInfo, err error) error {
			if strings.HasSuffix(info.Name(), ".xlsx") {
				if int64(time.Now().Sub(info.ModTime())/time.Millisecond/1000) > 1000 {
					os.Remove(path)
				}
			}
			return nil
		})
		time.Sleep(time.Second * 600)
	}
}

//每隔一个小时查看，积分商城每月是否库存重置
func InitProduct() {
	for {
		t := time.Now().Format("2006-01")
		d, err := DbOb.Query(fmt.Sprintf("select count(1) c from config where type='initproduct' and key='%s'", t))
		if err != nil {
			log.Println(err)
			time.Sleep(time.Second * 60)
			continue
		}
		if d[0]["c"] == "0" {
			err = DbOb.Exec("update product set inventory=num ")
			if err != nil {
				log.Println(err)
				time.Sleep(time.Second * 60)
				continue
			}
			err = DbOb.Exec(fmt.Sprintf("insert into config(type,key,value) values('initproduct','%s','1')", t))
			if err != nil {
				log.Println(err)
				time.Sleep(time.Second * 60)
				continue
			}
		}
		time.Sleep(time.Second * 3600)
	}
}

//每隔一个小时查一次微信素材
func GetWXMaterialWork() {
	for {
		GetWXMaterial()
		time.Sleep(time.Second * 3600)
	}
}

var (
	AppID     = "wx18161b639fa8ef7d"
	AppSecret = "fcfc9b006952929afe71a3c69bbc0aa9"
	Token     = ""
	wx_sc     sync.Mutex
)

type TokenOK struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

type TokenErr struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

func GetToken() {
	for {
		resp, err := http.Get(fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s", AppID, AppSecret))
		if err != nil {
			log.Println(err)
			time.Sleep(time.Second * 60)
			continue
		}
		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Println(err)
			time.Sleep(time.Second * 60)
			continue
		}
		content := string(body)
		var token *TokenOK = &TokenOK{}
		if strings.Index(content, "access_token") > 0 {
			err = json.Unmarshal(body, token)
			if err != nil {
				log.Println(err)
			}
			Token = token.AccessToken
			log.Println(token)
			log.Println(Token)
			break
		} else {
			log.Println("get toekn err:", content)
			time.Sleep(time.Second * 60)
			continue
		}
		time.Sleep(time.Second * 5400)
	}
}

type WX_SC struct {
	Total_count int    `json:"total_count"`
	Item_count  int    `json:"item_count"`
	Items       []Item `json:"item"`
}

type Item struct {
	Media_id    string  `json:"media_id"`
	Update_time int64   `json:"update_time"`
	Contents    Content `json:"content"`
}

type Content struct {
	News        []News `json:"news_item"`
	Create_time int64  `json:"create_time"`
	Update_time int64  `json:"update_time"`
}

type News struct {
	Title                 string `json:"title"`
	Author                string `json:"author"`
	Digest                string `json:"digest"`
	Content               string `json:"content"`
	Content_source_url    string `json:"content_source_url"`
	Thumb_media_id        string `json:"thumb_media_id"`
	Show_cover_pic        int    `json:"show_cover_pic"`
	Url                   string `json:"url"`
	Thumb_url             string `json:"thumb_url"`
	Need_open_comment     int    `json:"need_open_comment"`
	Only_fans_can_comment int    `json:"only_fans_can_comment"`
}

var (
	sc_URL  string = "https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=%s"
	sc_Body string = `{"type":"news","offset":%d,"count":20} `
)

func GetTime(miao int64) string {
	t := time.Unix(miao, miao)
	return t.Format("2006-01-02 15:04:05")
}

func GetWXMaterial() {
	wx_sc.Lock()
	defer wx_sc.Unlock()
	if Token == "" {
		go GetToken()
	}
	for Token == "" {
		time.Sleep(time.Second * 5)
	}
	var loadcount int = 0
	var resultmap []map[string]string = make([]map[string]string, 0)
	for {
		result := Post(fmt.Sprintf(sc_URL, Token), fmt.Sprintf(sc_Body, loadcount))
		if string(result) == "" {
			break
		}
		var wx *WX_SC = &WX_SC{}
		err := json.Unmarshal(result, wx)
		if err != nil {
			log.Println(err)
			break
		}
		for _, oneitem := range wx.Items {
			if len(oneitem.Contents.News) > 0 {
				log.Println(oneitem.Contents.News[0].Title)
				log.Println(oneitem.Contents.News[0].Author)
				log.Println(oneitem.Contents.News[0].Digest)
				log.Println(oneitem.Contents.News[0].Content_source_url)
				log.Println(oneitem.Contents.News[0].Thumb_media_id)
				log.Println(oneitem.Contents.News[0].Show_cover_pic)
				log.Println(oneitem.Contents.News[0].Url)
				log.Println(oneitem.Contents.News[0].Thumb_url)
				log.Println(oneitem.Contents.News[0].Need_open_comment)
				log.Println(oneitem.Contents.News[0].Only_fans_can_comment)
				additem := make(map[string]string)
				err := DownLoadImg(oneitem.Contents.News[0].Thumb_url, "./imgfile/"+oneitem.Contents.News[0].Thumb_media_id+".jpg")
				if err != nil {
					log.Println(err)
					additem["field0"] = "/imgfile/default.jpg"
				} else {
					additem["field0"] = "/imgfile/" + oneitem.Contents.News[0].Thumb_media_id + ".jpg"
				}
				additem["title"] = oneitem.Contents.News[0].Title
				additem["author"] = oneitem.Contents.News[0].Author
				additem["content"] = oneitem.Contents.News[0].Url
				additem["time"] = GetTime(oneitem.Contents.Create_time)
				//	additem["field0"] = oneitem.Contents.News[0].Thumb_url // oneitem.Contents.News[0].Content
				resultmap = append(resultmap, additem)
			}
		}
		loadcount += wx.Item_count
		if wx.Item_count == 0 || wx.Total_count == loadcount || wx.Item_count == wx.Total_count {
			break
		}
	}
	DbOb.Exec("delete from dynamic")
	for _, oneitem := range resultmap {
		DbOb.Exec(fmt.Sprintf("insert into dynamic(title,author,content,time,field0) values('%s','%s','%s','%s','%s')", oneitem["title"], oneitem["author"], oneitem["content"], oneitem["time"], oneitem["field0"]))
	}
	log.Println("end load dynamic")
}

var client1 = &http.Client{}

func Post(url, body string) []byte {
	req, err := http.NewRequest("POST", url, strings.NewReader(body))
	if err != nil {
		log.Println(err)
		return []byte("")
	}
	resp, err := client1.Do(req)
	if err != nil {
		log.Println(err)
		return []byte("")
	}
	defer resp.Body.Close()

	result, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Println(err)
		return []byte("")
	}
	return result
}

func DownLoadImg(url, filename string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	err = ioutil.WriteFile(filename, b, 0x644)
	return err
}
