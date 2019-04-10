package controllers

import (
	"../models"
	"encoding/json"
	"fmt"
	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
	"image/png"
	"log"
	"os"
	"strconv"
	"sync"
	"time"
)

var (
	product_luck sync.Mutex
)

type ProductController struct {
	ywcontroller
}

func (this *ProductController) ToShowJF() {
	data, err := models.DbOb.Query(fmt.Sprintf("select * from integrallog where userid2='%s'", this.GetSession("id").(string)))
	if err != nil {
		log.Println(err)
		this.Data["data"] = make([]map[string]string, 0)
	} else {
		if len(data) == 0 {
			log.Println("len 0")
			this.Data["data"] = make([]map[string]string, 0)
		} else {
			this.Data["data"] = data
		}
	}
	this.TplName = "showjifeng.html"
}

func (this *ProductController) ToShowInfo() {
	id := this.GetParamAsInt("id")
	data, err := models.DbOb.Query(fmt.Sprintf("select * from product where id='%d'", id))
	if err != nil {
		log.Println(err)
		this.Data["data"] = map[string]string{}
	} else {
		if len(data) == 0 {
			log.Println("len 0")
			this.Data["data"] = map[string]string{}
		} else {
			this.Data["data"] = data[0]
		}
	}
	this.TplName = "showproduct.html"
}

func (this *ProductController) ToShowList() {
	this.TplName = "showproductlist.html"
}

func (this *ProductController) ToList() {
	this.TplName = "productlist.html"
}

func (this *ProductController) List() {
	title := this.GetParamAsSqlString("title")
	types := this.GetParamAsSqlString("types")
	sponsors := this.GetParamAsSqlString("sponsors")
	place := this.GetParamAsSqlString("place")
	status := this.GetParamAsSqlString("status")
	pagesize := this.GetParamAsInt("pageSize")
	pageindex := this.GetParamAsInt("pageIndex")
	if status == "" {
		status = "1"
	}
	result, err := models.DbOb.QueryTableList(fmt.Sprintf(`select * from product where type like '%%%s%%' and place like '%%%s%%' and title like '%%%s%%' and sponsors like '%%%s%%' and status=%s order by integral desc`,
		types, place, title, sponsors, status), pageindex, pagesize)
	if err != nil {
		log.Println(err.Error())
	}
	bt, _ := json.Marshal(result)
	this.ReturnString(string(bt))
}
func (this *ProductController) ToRecordList() {
	n := time.Now()
	s := make([]string, 0)
	y := n.Year()
	m := int(n.Month())

	for i := 0; i < 12; i++ {
		if m == 0 {
			y--
			m = 12
		}
		sm := fmt.Sprint(m)
		if m < 10 {
			sm = "0" + sm
		}
		s = append(s, fmt.Sprintf("%d-%s", y, sm))
		m--
	}
	this.Data["t"] = s
	this.TplName = "recordlist.html"
}
func (this *ProductController) RecordList() {
	time := this.GetParamAsSqlString("time")
	usedtime := this.GetParamAsSqlString("usedtime")
	used := this.GetParamAsSqlString("used")
	types := this.GetParamAsSqlString("type")
	title := this.GetParamAsSqlString("title")
	name := this.GetParamAsSqlString("name")
	sponsors := this.GetParamAsSqlString("sponsors")
	pagesize := this.GetParamAsInt("pageSize")
	pageindex := this.GetParamAsInt("pageIndex")

	sql := `select c.*,p.*,u.name
			from productrecord c left join product p on p.id=c.productid
			left join usertable u on u.id=c.userid where 1=1`
	if name != "" {
		sql += " and u.name like '%%" + name + "%%'"
	}
	if title != "" {
		sql += " and p.title like '%%" + title + "%%'"
	}
	if types != "" {
		sql += " and p.type like '%%" + types + "%%'"
	}
	if used != "" {
		sql += " and c.used=" + used
	}
	if sponsors != "" {
		sql += " and p.sponsors='" + sponsors + "'"
	}
	if usedtime != "" {
		sql += " and date(c.usedtime)>='" + usedtime + "-01' and date(c.usedtime)<='" + usedtime + "-31'"
	}

	if time != "" {
		sql += " and date(c.time)>='" + time + "-01' and date(c.time)<='" + time + "-31'"
	}
	/*
		where time,usedtime
	*/
	log.Println(sql)
	result, err := models.DbOb.QueryTableList(sql+" order by c.id desc", pageindex, pagesize)
	if err != nil {
		log.Println(err.Error())
	}
	bt, _ := json.Marshal(result)
	this.ReturnString(string(bt))
}

/*
select c.*,p.*,u.*
from productrecord c left join product p on p.id=c.productid
left join usertable u on u.id=c.userid
where time,usedtime,used,type,title,name
*/
///
func (this *ProductController) Del() {
	id := this.GetParamAsInt("id")
	err := models.DbOb.Exec(fmt.Sprintf(`delete from product where id=%d`, id))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "删除失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "删除成功", "")
	}
}

func (this *ProductController) ToEdit() {
	id := this.GetParamAsInt("id")
	data, err := models.DbOb.Query(fmt.Sprintf("select * from product where id='%d'", id))
	if err != nil {
		log.Println(err)
		this.Data["data"] = map[string]string{}
	} else {
		if len(data) == 0 {
			log.Println("len 0")
			this.Data["data"] = map[string]string{}
		} else {
			this.Data["data"] = data[0]
		}
	}
	this.TplName = "editproduct.html"
}

func (this *ProductController) Save() {
	//type,title,img,des,imgdes,sponsors,rules,place,integral,num,status
	id := this.GetParamAsInt("id")
	types := this.GetParamAsSqlString("types")
	title := this.GetParamAsSqlString("title")
	img := this.GetParamAsSqlString("img")
	des := this.GetParamAsSqlString("des")
	imgdes := this.GetParamAsSqlString("imgdes")
	sponsors := this.GetParamAsSqlString("sponsors")
	rules := this.GetParamAsSqlString("rules")
	place := this.GetParamAsSqlString("place")
	integral := this.GetParamAsSqlString("integral")
	num := this.GetParamAsInt("num")
	inventory := this.GetParamAsInt("inventory")
	status := this.GetParamAsInt("status")

	sql := ""
	if id == 0 {
		sql = fmt.Sprintf("insert into product(type,title,img,des,imgdes,sponsors,rules,place,integral,num,inventory,status) values('%s','%s','%s','%s','%s','%s','%s','%s',%s,%d,%d,%d)",
			types, title, img, des, imgdes, sponsors, rules, place, integral, num, inventory, status)
	} else {
		sql = fmt.Sprintf("update product set type='%s',title='%s',img='%s',des='%s',imgdes='%s',sponsors='%s',rules='%s',place='%s',integral=%s,num=%d,inventory=%d,status=%d where id=%d",
			types, title, img, des, imgdes, sponsors, rules, place, integral, num, inventory, status, id)
	}
	err := models.DbOb.Exec(sql)
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "保存失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "保存成功", "")
	}
}

func (this *ProductController) ExChange() {
	product_luck.Lock()
	defer product_luck.Unlock()

	userid := this.GetSession("id")
	userinfo, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where  id=%s", userid))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "兑换失败，请刷新", "")
		return
	}
	id := this.GetParamAsInt("id")
	//判断是否已经兑换过了
	has, err := models.DbOb.Query(fmt.Sprintf("select * from productrecord where productid=%d and userid=%s and substr(time,0,8)='%s'", id, userid, time.Now().Format("2006-01")))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "兑换失败，请刷新", "")
		return
	} else {
		if len(has) != 0 {
			this.ReturnJsonString(0, "本月已兑换过此商品", "")
			return
		}
	}

	data, err := models.DbOb.Query(fmt.Sprintf("select * from product where id='%d'", id))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "兑换失败，请刷新", "")
		return
	} else {
		if len(data) == 0 {
			this.ReturnJsonString(0, "已经下架", "")
			return
		} else {
			if data[0]["inventory"] == "0" {
				this.ReturnJsonString(0, "库存不足", "")
				return
			}
			//data[0]
			c, err := models.DbOb.Query(fmt.Sprintf("select count(*) c from usertable where  integral>=%s and id=%s", data[0]["integral"], userid))
			if err != nil {
				log.Println(err)
				this.ReturnJsonString(0, "兑换失败，请刷新", "")
				return
			}
			if c[0]["c"] != "1" {
				this.ReturnJsonString(0, "积分不足", "")
				return
			}
			err = models.DbOb.Exec(fmt.Sprintf("update product set inventory=inventory-1 where id=%d", id))
			if err != nil {
				log.Println(err)
				this.ReturnJsonString(0, "兑换失败，请刷新", "")
				return
			}
			err = models.DbOb.Exec(fmt.Sprintf("update usertable set integral=integral-%s where id=%s", data[0]["integral"], userid))
			if err != nil {
				log.Println(err)
				this.ReturnJsonString(0, "兑换失败，请刷新", "")
				return
			}
			//
			code := this.SWSMD5(this.GetDateTime())
			filename := "./imgfile/" + code + ".png"
			this.writePng(fmt.Sprintf(models.SysCon.Host+"/user/usedkb?code=%s", code), filename)
			err = models.DbOb.Exec(fmt.Sprintf("insert into productrecord(productid,userid,time,used,usedtime,code) values(%d,%s,'%s',0,'','%s')",
				id, userid, this.GetDateTime(), code))
			if err != nil {
				log.Println(err)
				this.ReturnJsonString(0, "系统出错", "")
				return
			}
			//添加记录

			f_jianintegral, err1 := strconv.ParseFloat(data[0]["integral"], 64)
			f_integral, err2 := strconv.ParseFloat(userinfo[0]["integral"], 64)
			if err1 != nil || err2 != nil {
				log.Println(err1)
				log.Println(err2)
				f_jianintegral = 0
				f_integral = 0
				log.Println(fmt.Sprintf("%.1f", f_integral-f_jianintegral))
			}
			err = models.DbOb.Exec(fmt.Sprintf(`insert into integrallog(userid1,username1,userid2,username2,integral1,integral2,addintegral,why,actiontime,eventid) 
				values(0,'爱心商品兑换',%s,'%s',%s,%s,-%s,'%s','%s',0)`,
				this.GetSession("id").(string), this.GetSession("name").(string),
				userinfo[0]["integral"], fmt.Sprintf("%.1f", f_integral-f_jianintegral), data[0]["integral"],
				"成功兑换 "+data[0]["title"], this.GetDateTime()))
			if err != nil {
				log.Println(err)
			}
			//
			this.ReturnJsonString(1, "兑换成功", "")
			return
		}
	}
}
func (this *ProductController) writePng(base64, filename string) {
	log.Println("Original data:", base64)
	code, err := qr.Encode(base64, qr.L, qr.Unicode)
	// code, err := code39.Encode(base64)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Encoded data: ", code.Content())

	if base64 != code.Content() {
		log.Fatal("data differs")
	}

	code, err = barcode.Scale(code, 300, 300)
	if err != nil {
		log.Fatal(err)
	}

	file, err := os.Create(filename)
	if err != nil {
		log.Fatal(err)
	}
	err = png.Encode(file, code)
	// err = jpeg.Encode(file, img, &jpeg.Options{100})      //图像质量值为100，是最好的图像显示
	if err != nil {
		log.Fatal(err)
	}
	file.Close()
	log.Println(file.Name())
}
