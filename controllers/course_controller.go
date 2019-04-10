package controllers

import (
	"../models"
	"fmt"
	"log"
	"strconv"
	"sync"
)

type CourseController struct {
	ywcontroller
}

var adduser sync.Mutex

func (this *CourseController) List() {
	this.Data["permissions"] = this.GetPermissions()
	this.TplName = "courselist.html"
}

func (this *CourseController) GetList() {
	pageindex := this.GetParamAsInt("pageindex")
	r, err := models.DbOb.QueryTableList("select course.*,usertable.name,teacher.technical from course left join usertable on course.userid=usertable.id left join teacher on teacher.usertableid=course.userid order by course.id desc", pageindex, 20)
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "", "")
	} else {
		this.ReturnJsonString(1, "", r)
	}
}

func (this *CourseController) ToDel() {
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from course where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	this.TplName = "delcourse.html"
}

func (this *CourseController) Del() {
	id := this.GetParamAsInt("id")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	} else {
		models.DbOb.Exec(fmt.Sprintf("delete from course where id=%d", id))
		this.ReturnJsonString(1, "", "")
	}
}

func (this *CourseController) ToEdit() {
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from course where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = map[string]string{"content": ""}
	}
	u, err := models.DbOb.Query("select teacher.*,usertable.name from teacher left join usertable on teacher.usertableid=usertable.id")
	if err != nil {
		log.Println(err)
	}
	this.Data["id"] = id
	this.Data["userlist"] = u
	this.TplName = "editcourse.html"
}

func (this *CourseController) Edit() {
	id := this.GetParamAsInt("id")
	theme := this.GetParamAsSqlString("theme")
	userid := this.GetParamAsInt("userid")
	content := this.GetParamAsSqlString("content")
	sintegralnum := this.GetParamAsSqlString("integralnum")
	integralnum, err := strconv.Atoi(sintegralnum)
	if err != nil {
		this.ReturnJsonString(0, "积分必须为整数", "")
		return
	}
	if integralnum < 0 {
		this.ReturnJsonString(0, "积分必须为整数", "")
		return
	}
	place := this.GetParamAsSqlString("place")
	times := this.GetParamAsSqlString("time")
	usernum := this.GetParamAsInt("usernum")
	if usernum == 0 || usernum < 0 {
		this.ReturnJsonString(0, "可报名人数必须为整数", "")
		return
	}
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	}

	sql := ""
	if id == 0 {
		sql = fmt.Sprintf("insert into course(theme,userid,content,time,integralnum,place,usernum) values('%s',%d,'%s','%s',%d,'%s',%d)",
			theme, userid, content, times, integralnum, place, usernum)
	} else {
		sql = fmt.Sprintf("update course set theme='%s',userid=%d,content='%s',time='%s',integralnum=%d,place='%s',usernum=%d where id=%d",
			theme, userid, content, times, integralnum, place, usernum, id)
	}
	err = models.DbOb.Exec(sql)
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "操作失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "", "")
	}
}

func (this *CourseController) Show() {
	this.Data["permissions"] = this.GetPermissions()
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select course.*,usertable.name,teacher.technical from course left join usertable on course.userid=usertable.id left join teacher on teacher.usertableid=course.userid where course.id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	userlist, err := models.DbOb.Query(fmt.Sprintf("select * from courseuser where courseid=%d", id))
	if err != nil {
		log.Println(err)
	}
	this.Data["userlist"] = userlist
	this.TplName = "showcourse.html"
}

func (this *CourseController) AddUser() {
	adduser.Lock()
	defer adduser.Unlock()

	courseid := this.GetParamAsInt("courseid")
	userid := this.GetSession("id").(string)
	name := this.GetParamAsSqlString("name")
	tel := this.GetParamAsSqlString("tel")

	//课程查询
	couserlist, err := models.DbOb.Query(fmt.Sprintf("select course.*,ifnull(cu.num,0) bmnum from course left join (select courseid,count(1) num from courseuser group by courseid) cu on course.id=cu.courseid where id=%d", courseid))
	if err != nil || len(couserlist) == 0 {
		log.Println(err)
		log.Println(len(couserlist))
		this.ReturnJsonString(0, "操作失败，请刷新", "")
		return
	}
	//报名人数是否满了
	bmnum, err := strconv.Atoi(couserlist[0]["bmnum"])
	if err != nil {
		this.ReturnJsonString(0, "课程信息有误，请联系管理员", "")
		return
	}
	usernum, err := strconv.Atoi(couserlist[0]["usernum"])
	if err != nil {
		this.ReturnJsonString(0, "课程信息有误，请联系管理员", "")
		return
	}
	if bmnum >= usernum {
		this.ReturnJsonString(0, "报名人数已满", "")
		return
	}
	//个人是否积分够了
	userinfo, err := models.DbOb.Query(fmt.Sprintf("select count(1) find from usertable where integral>=%s and id=%s", couserlist[0]["integralnum"], userid))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "请刷新", "")
		return
	}
	if userinfo[0]["find"] == "0" {
		this.ReturnJsonString(0, "积分不足", "")
		return
	}
	//报名inser
	err = models.DbOb.Exec(fmt.Sprintf("insert into courseuser(courseid,userid,name,tel,time) values(%d,%s,'%s','%s','%s')", courseid, userid, name, tel, this.GetDateTime()))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "请刷新", "")
		return
	}
	err = models.DbOb.Exec(fmt.Sprintf("update usertable set integral=integral-%s where id=%s", couserlist[0]["integralnum"], userid))
	if err != nil {
		log.Println(err)
		log.Println("userid:", userid, "报名courseid:", courseid, "成功，但扣分", couserlist[0]["integralnum"], "失败")
		this.ReturnJsonString(0, "请刷新", "")
		return
	}
	this.ReturnJsonString(1, "报名成功", "")
}
