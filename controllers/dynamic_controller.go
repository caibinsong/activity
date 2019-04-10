package controllers

import (
	"../models"
	"fmt"
	"log"
)

type DynamicController struct {
	ywcontroller
}

func (this *DynamicController) List() {
	log.Println(this.GetPermissions())
	this.Data["permissions"] = this.GetPermissions()
	this.TplName = "dynamiclist.html"
}

func (this *DynamicController) GetList() {
	pageindex := this.GetParamAsInt("pageindex")
	log.Println(pageindex)
	r, err := models.DbOb.QueryTableList("select * from dynamic order by time desc", pageindex, 20)
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "", "")
	} else {
		this.ReturnJsonString(1, "", r)
	}
}

func (this *DynamicController) ToDel() {
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from dynamic where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	this.TplName = "deldynamic.html"
}

func (this *DynamicController) Del() {
	id := this.GetParamAsInt("id")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	} else {
		models.DbOb.Exec(fmt.Sprintf("delete from dynamic where id=%d", id))
		this.ReturnJsonString(1, "", "")
	}
}

func (this *DynamicController) ToEdit() {
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from dynamic where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = map[string]string{"content": ""}
	}
	this.TplName = "editdynamic.html"
}

func (this *DynamicController) Edit() {
	id := this.GetParamAsInt("id")
	title := this.GetParamAsSqlString("title")
	content := this.GetParamAsSqlString("content")
	author := this.GetSession("name")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	}
	sql := ""
	if id == 0 {
		sql = fmt.Sprintf("insert into dynamic(title,author,content,time) values('%s','%s','%s','%s')", title, author, content, this.GetDateTime())
	} else {
		sql = fmt.Sprintf("update dynamic set title='%s',content='%s',time='%s' where id=%d", title, content, this.GetDateTime(), id)
	}
	err := models.DbOb.Exec(sql)
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "操作失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "", "")
	}
}

func (this *DynamicController) Show() {
	this.Data["permissions"] = this.GetPermissions()
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from dynamic where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	this.TplName = "showdynamic.html"
}

func (this *DynamicController) Update() {
	models.GetWXMaterial()
	this.ReturnJsonString(1, "", "")
}
