package controllers

import (
	"../models"
	"code.google.com/p/mahonia"
	"encoding/json"
	"fmt"
	"github.com/tealeg/xlsx"
	"log"
	"net/http"
	"strings"
)

type UserController struct {
	ywcontroller
}

func (this *UserController) ToUpUser() {
	this.Data["title"] = this.GetParamAsSqlString("title")
	this.Data["d"] = this.GetParamAsSqlString("d")
	this.Data["c"] = this.GetParamAsSqlString("c")
	this.TplName = "upuser.html"
}

func (this *UserController) UpUser() {
	id := this.GetSession("id")
	d := this.GetParamAsSqlString("d")
	c := this.GetParamAsString("c")
	if strings.Index(c, "user") != -1 || strings.Index(c, "integral") != -1 || strings.Index(c, "permissions") != -1 {
		this.ReturnJsonString(0, "敏感词不可用", "")
		return
	}
	err := models.DbOb.Exec(fmt.Sprintf(`update usertable set %s='%s' where id=%s`, d, c, id))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "修改失败，请重新登录", "")
	} else {
		this.ReturnJsonString(1, "修改成功", "")
	}
}
func (this *UserController) Home() {
	id := this.GetSession("id")
	if id == nil {
		this.TplName = "login.html"
	} else {
		d, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where id='%s'", id))
		if err != nil {
			log.Println(err.Error())
			this.TplName = "login.html"
			return
		}
		if len(d) != 1 {
			log.Println("个人长度为", len(d))
			this.TplName = "login.html"
			return
		}
		hd, err := models.DbOb.Query(fmt.Sprintf("select ifnull(count(1),0) cs,ifnull(sum(addintegral),0) integral from user where idcard=%s", id))
		if err != nil {
			log.Println(err.Error())
			this.TplName = "login.html"
			return
		}
		this.Data["huodong"] = hd[0]
		this.Data["data"] = d[0]
		this.TplName = "home.html"
	}
}
func (this *UserController) UserInfo() {
	id := this.GetSession("id")
	if id == nil {
		this.TplName = "login.html"
	} else {
		d, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where id='%s'", id))
		if err != nil {
			log.Println(err.Error())
			this.TplName = "login.html"
			return
		}
		if len(d) != 1 {
			log.Println("个人长度为", len(d))
			this.TplName = "login.html"
			return
		}
		this.Data["data"] = d[0]
		this.TplName = "userinfo.html"
	}
}

func (this *UserController) ToRegistered() {
	this.TplName = "registered.html"
}

func (this *UserController) ToResetPass() {
	this.TplName = "resetpass.html"
}

func (this *UserController) DelUser() {
	id := this.GetParamAsInt("id")
	err := models.DbOb.Exec(fmt.Sprintf(`delete from usertable where id=%d`, id))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "删除失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "删除成功", "")
	}
}

func (this *UserController) Reset() {
	//fmt.Println("=============================")
	user := this.GetParamAsSqlString("user")
	idcard := this.GetParamAsSqlString("idcard")
	d, err := models.DbOb.Query(fmt.Sprintf("select idcard from usertable where user='%s'", user))
	if err != nil || len(d) == 0 {
		if err != nil {
			log.Println(err.Error())
		}
		this.ReturnJsonString(0, "用户不存在", "")
		return
	}
	if d[0]["idcard"] != idcard {
		this.ReturnJsonString(0, "身份证号码不正确", "")
		return
	}
	if d[0]["idcard"] == idcard {
		//更新到数据库
		err = models.DbOb.Exec(fmt.Sprintf("update usertable set pwd='123456' where user='%s'", user))
		if err != nil {
			log.Println(err.Error())
			this.ReturnJsonString(0, "系统异常，请稍后再试", "")
			return
		}
		this.ReturnJsonString(0, "操作成功！密码重置为123456", "")
		return
	}
	this.ReturnJsonString(0, "系统异常，请稍后再试", "")
	return
}

func (this *UserController) Add() {
	//user pwd name sex tel idcard political specialty place addr qq wx email
	user := this.GetParamAsSqlString("user")
	pwd := this.GetParamAsSqlString("pwd")
	name := this.GetParamAsSqlString("name")
	sex := this.GetParamAsSqlString("sex")
	tel := this.GetParamAsSqlString("tel")
	idcard := this.GetParamAsSqlString("idcard")
	political := this.GetParamAsSqlString("political")
	specialty := this.GetParamAsSqlString("specialty")
	place := this.GetParamAsSqlString("place")
	addr := this.GetParamAsSqlString("addr")
	qq := this.GetParamAsSqlString("qq")
	wx := this.GetParamAsSqlString("wx")
	email := this.GetParamAsSqlString("email")
	teamname := this.GetParamAsSqlString("teamname")

	//判断用户名是否已经存在
	d, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where user='%s'", user))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "注册失败，请刷新", "")
		return
	}
	if len(d) != 0 {
		log.Println("用户名已经存在")
		this.ReturnJsonString(0, "用户名已经存在", "")
		return
	}
	//同手机号同姓名是否已经存在
	d, err = models.DbOb.Query(fmt.Sprintf("select * from usertable where name='%s' and tel='%s'", name, tel))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "注册失败，请刷新", "")
		return
	}
	if len(d) != 0 {
		log.Println("姓名与手机号已经存在")
		this.ReturnJsonString(0, "姓名与手机号已经存在", "")
		return
	}
	//注册
	err = models.DbOb.Exec(fmt.Sprintf(`insert into usertable(user ,name , sex ,pwd ,tel ,idcard ,political ,specialty ,place,addr, qq,wx ,email,createtime,permissions,integral,teamname) 
		values('%s' ,'%s' , '%s' ,'%s' ,'%s' ,'%s' ,'%s' ,'%s' ,'%s','%s', '%s','%s' ,'%s','%s','0',0,'%s')`,
		user, name, sex, pwd, tel, idcard, political, specialty, place, addr, qq, wx, email, this.GetDateTime(), teamname))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "注册失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "注册成功", "")
	}
}

func (this *UserController) ToList() {
	this.TplName = "userlist.html"
}

func (this *UserController) List() {
	name := this.GetParamAsSqlString("name")
	sex := this.GetParamAsSqlString("sex")
	tel := this.GetParamAsSqlString("tel")
	political := this.GetParamAsSqlString("political")
	specialty := this.GetParamAsSqlString("specialty")
	place := this.GetParamAsSqlString("place")
	pagesize := this.GetParamAsInt("pageSize")
	pageindex := this.GetParamAsInt("pageIndex")
	result, err := models.DbOb.QueryTableList(fmt.Sprintf(`select usertable.*,ifnull(teacher.id,'true') as tcid from usertable 
left join teacher on usertable.id=teacher.usertableid
where usertable.name like '%%%s%%' and usertable.sex like '%%%s%%' and usertable.tel like '%%%s%%' and usertable.political like '%%%s%%' and usertable.specialty like '%%%s%%' and usertable.place like '%%%s%%' 
order by usertable.createtime desc`,
		name, sex, tel, political, specialty, place), pageindex, pagesize)
	if err != nil {
		log.Println(err.Error())
	}
	bt, _ := json.Marshal(result)
	this.ReturnString(string(bt))
}

//导出用户
func (this *UserController) ExportUserList() {
	name := this.GetParamAsSqlString("name")
	sex := this.GetParamAsSqlString("sex")
	tel := this.GetParamAsSqlString("tel")
	political := this.GetParamAsSqlString("political")
	specialty := this.GetParamAsSqlString("specialty")
	place := this.GetParamAsSqlString("place")
	result, err := models.DbOb.Query(fmt.Sprintf(`select usertable.*,ifnull(teacher.id,'true') as tcid from usertable 
left join teacher on usertable.id=teacher.usertableid
where usertable.name like '%%%s%%' and usertable.sex like '%%%s%%' and usertable.tel like '%%%s%%' and usertable.political like '%%%s%%' and usertable.specialty like '%%%s%%' and usertable.place like '%%%s%%' `,
		name, sex, tel, political, specialty, place))
	if err != nil {
		log.Println(err.Error())
	}
	file := xlsx.NewFile()
	sheet, _ := file.AddSheet("Sheet1")
	row := sheet.AddRow()
	row.SetHeightCM(1) //设置每行的高度
	cell := row.AddCell()
	cell.Value = "序号"
	cell = row.AddCell()
	cell.Value = "姓名"
	cell = row.AddCell()
	cell.Value = "性别"
	cell = row.AddCell()
	cell.Value = "手机号"
	cell = row.AddCell()
	cell.Value = "身份证"
	cell = row.AddCell()
	cell.Value = "政治面貌"
	cell = row.AddCell()
	cell.Value = "特长"
	cell = row.AddCell()
	cell.Value = "居住地"
	cell = row.AddCell()
	cell.Value = "地址"
	cell = row.AddCell()
	cell.Value = "QQ"
	cell = row.AddCell()
	cell.Value = "微信"
	cell = row.AddCell()
	cell.Value = "邮箱"
	cell = row.AddCell()
	cell.Value = "积分"
	cell = row.AddCell()
	cell.Value = "权限"
	cell = row.AddCell()
	cell.Value = "是否为讲师"
	//性别 手机 身份证 政治面貌	特长	居住地	地址 QQ	微信	邮箱	积分 权限 是否为讲师 political,specialty,place,addr,qq,wx,email,integral,permissions,tcid
	for _, onemap := range result {
		row := sheet.AddRow()
		row.SetHeightCM(1) //设置每行的高度
		cell := row.AddCell()
		cell.Value = onemap["xhid"]
		cell = row.AddCell()
		cell.Value = onemap["name"]

		cell = row.AddCell()
		cell.Value = onemap["sex"]
		cell = row.AddCell()
		cell.Value = onemap["tel"]
		cell = row.AddCell()
		cell.Value = onemap["idcard"]
		cell = row.AddCell()
		cell.Value = onemap["political"]
		cell = row.AddCell()
		cell.Value = onemap["specialty"]
		cell = row.AddCell()
		cell.Value = onemap["place"]
		cell = row.AddCell()
		cell.Value = onemap["addr"]
		cell = row.AddCell()
		cell.Value = onemap["qq"]
		cell = row.AddCell()
		cell.Value = onemap["wx"]
		cell = row.AddCell()
		cell.Value = onemap["email"]
		cell = row.AddCell()
		cell.Value = onemap["integral"]
		cell = row.AddCell()
		if onemap["permissions"] == "3" {
			cell.Value = "总管理员"
		} else if onemap["permissions"] == "2" {
			cell.Value = "管理员"
		} else if onemap["permissions"] == "1" {
			cell.Value = "小队长"
		} else {
			cell.Value = "普通会员"
		}
		cell = row.AddCell()
		if onemap["tcid"] == "true" {
			cell.Value = "否"
		} else {
			cell.Value = "是"
		}

	}
	excelpath := "./export/用户" + this.GetDateTimeStr() + ".xlsx"
	err = file.Save(excelpath)
	if err != nil {
		this.ReturnString("导出失败，请重试")
		return
	}
	enc := mahonia.NewEncoder("gbk")
	gbkfile := enc.ConvertString("用户表.xlsx")
	this.Ctx.ResponseWriter.Header().Set("Content-Disposition", "attachment;filename="+gbkfile)
	http.ServeFile(this.Ctx.ResponseWriter, this.Ctx.Request, excelpath)
}

func (this *UserController) ToEditUser() {
	id := this.GetParamAsInt("id")
	data, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where id='%d'", id))
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
	this.TplName = "edituser.html"
}

func (this *UserController) SaveUser() {
	id := this.GetParamAsInt("id")
	user := this.GetParamAsSqlString("user")
	name := this.GetParamAsSqlString("name")
	sex := this.GetParamAsSqlString("sex")
	tel := this.GetParamAsSqlString("tel")
	political := this.GetParamAsSqlString("political")
	specialty := this.GetParamAsSqlString("specialty")
	place := this.GetParamAsSqlString("place")
	addr := this.GetParamAsSqlString("addr")
	wx := this.GetParamAsSqlString("wx")
	qq := this.GetParamAsSqlString("qq")
	email := this.GetParamAsSqlString("email")
	integral := this.GetParamAsSqlString("integral")
	permissions := this.GetParamAsSqlString("permissions")
	teamname := this.GetParamAsSqlString("teamname")

	//判断用户名是否已经存在
	d, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where user='%s' and id<>%d", user, id))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "修改失败，请刷新", "")
		return
	}
	if len(d) != 0 {
		log.Println("用户名已经存在")
		this.ReturnJsonString(0, "用户名已经存在", "")
		return
	}
	//同手机号同姓名是否已经存在
	d, err = models.DbOb.Query(fmt.Sprintf("select * from usertable where name='%s' and tel='%s' and id<>%d", name, tel, id))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "修改失败，请刷新", "")
		return
	}
	if len(d) != 0 {
		log.Println("姓名与手机号已经存在")
		this.ReturnJsonString(0, "姓名与手机号已经存在", "")
		return
	}
	//查询当前用户信息
	d, err = models.DbOb.Query(fmt.Sprintf("select * from usertable where id=%d", id))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "修改失败，请刷新", "")
		return
	}
	if len(d) != 1 {
		log.Println("用户不存在")
		this.ReturnJsonString(0, "用户不存在", "")
		return
	}
	if d[0]["integral"] != integral {
		//userid1操作人 userid2被操作人  integral1操作前积分 integral2操作后积分
		err = models.DbOb.Exec(fmt.Sprintf("insert into integrallog(userid1,username1,userid2,username2,integral1,integral2,addintegral,why,actiontime) values(%s,'%s',%s,'%s',%s,%s,0,'%s管理员后台操作修改积分','%s')",
			this.GetSession("id").(string), this.GetSession("name").(string),
			d[0]["id"], d[0]["name"], d[0]["integral"], integral, this.GetSession("name").(string), this.GetDateTime()))
	}
	err = models.DbOb.Exec(fmt.Sprintf("update usertable set teamname='%s',user='%s',name='%s',sex='%s',tel='%s',political='%s',specialty='%s',place='%s',addr='%s',wx='%s',qq='%s',email='%s',integral='%s',permissions='%s' where id='%d'",
		teamname, user, name, sex, tel, political, specialty, place, addr, wx, qq, email, integral, permissions, id))
	if err != nil {
		this.ReturnString(this.jsonString(0, "保存失败，请刷新", err.Error()))
	} else {
		this.ReturnString(this.jsonString(1, "保存成功", ""))
	}
}

//讲师
func (this *UserController) ShowTeacher() {
	id := this.GetParamAsInt("id")
	user, err := models.DbOb.Query(fmt.Sprintf("select usertable.id uid,usertable.name,teacher.* from usertable left join teacher on usertable.id=teacher.usertableid where usertable.id=%d", id))
	if err != nil || len(user) == 0 {
		log.Println(err)
		this.Data["data"] = map[string]string{}
		this.TplName = "showteacher.html"
		return
	}
	this.Data["data"] = user[0]
	this.TplName = "showteacher.html"
}
func (this *UserController) ToShowTeacherList() {
	this.TplName = "showteacherlist.html"
}

func (this *UserController) ToTeacherList() {
	this.TplName = "teacherlist.html"
}

func (this *UserController) TeacherList() {
	name := this.GetParamAsSqlString("name")
	technical := this.GetParamAsSqlString("technical")
	pagesize := this.GetParamAsInt("pageSize")
	pageindex := this.GetParamAsInt("pageIndex")

	result, err := models.DbOb.QueryTableList(fmt.Sprintf(`select usertable.id uid,usertable.name,teacher.* from usertable left join teacher on usertable.id=teacher.usertableid 
		where teacher.id is not null and usertable.name like '%%%s%%' and teacher.technical like '%%%s%%' order by id desc`,
		name, technical), pageindex, pagesize)
	if err != nil {
		log.Println(err.Error())
	}
	bt, _ := json.Marshal(result)
	this.ReturnString(string(bt))
}

//导出讲师
func (this *UserController) ExportTeacherList() {
	name := this.GetParamAsSqlString("name")
	technical := this.GetParamAsSqlString("technical")

	result, err := models.DbOb.Query(fmt.Sprintf(`select usertable.id uid,usertable.name,teacher.* from usertable left join teacher on usertable.id=teacher.usertableid 
		where teacher.id is not null and usertable.name like '%%%s%%' and teacher.technical like '%%%s%%'`, name, technical))
	if err != nil {
		log.Println(err.Error())
	}
	file := xlsx.NewFile()
	sheet, _ := file.AddSheet("Sheet1")
	row := sheet.AddRow()
	row.SetHeightCM(1) //设置每行的高度
	cell := row.AddCell()
	cell.Value = "序号"
	cell = row.AddCell()
	cell.Value = "姓名"
	cell = row.AddCell()
	cell.Value = "职称"
	cell = row.AddCell()
	cell.Value = "特长"
	cell = row.AddCell()
	cell.Value = "简介"
	for _, onemap := range result {
		row := sheet.AddRow()
		row.SetHeightCM(1) //设置每行的高度
		cell := row.AddCell()
		cell.Value = onemap["xhid"]
		cell = row.AddCell()
		cell.Value = onemap["name"]
		cell = row.AddCell()
		cell.Value = onemap["technical"]
		cell = row.AddCell()
		cell.Value = onemap["specialty"]
		cell = row.AddCell()
		cell.Value = onemap["des"]
	}
	excelpath := "./export/讲师" + this.GetDateTimeStr() + ".xlsx"
	err = file.Save(excelpath)
	if err != nil {
		this.ReturnString("导出失败，请重试")
		return
	}
	enc := mahonia.NewEncoder("gbk")
	gbkfile := enc.ConvertString("讲师表.xlsx")
	this.Ctx.ResponseWriter.Header().Set("Content-Disposition", "attachment;filename="+gbkfile)
	http.ServeFile(this.Ctx.ResponseWriter, this.Ctx.Request, excelpath)
}

func (this *UserController) SaveTeacher() {
	id := this.GetParamAsInt("id")
	usertableid := this.GetParamAsInt("usertableid")
	img := this.GetParamAsSqlString("img")
	technical := this.GetParamAsSqlString("technical")
	specialty := this.GetParamAsSqlString("specialty")
	des := this.GetParamAsSqlString("des")
	sql := ""
	if id == 0 {
		//insert
		sql = fmt.Sprintf("insert into teacher(usertableid,img,technical,specialty,des) values(%d,'%s','%s','%s','%s')",
			usertableid, img, technical, specialty, des)
	} else {
		//update
		sql = fmt.Sprintf("update teacher set img='%s',technical='%s',specialty='%s',des='%s' where id=%d", img, technical, specialty, des, id)
	}
	err := models.DbOb.Exec(sql)
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "操作失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "操作成功", "")
	}
}

func (this *UserController) ToEditTeacher() {
	usertableid := this.GetParamAsInt("usertableid")
	id := this.GetParamAsInt("id")

	user, err := models.DbOb.Query(fmt.Sprintf("select usertable.id uid,usertable.name,teacher.* from usertable left join teacher on usertable.id=teacher.usertableid where usertable.id=%d", usertableid))
	if err != nil || len(user) == 0 {
		log.Println(err, user)
		this.Data["data"] = map[string]string{}
		this.TplName = "editteacher.html"
		return
	}
	this.Data["data"] = user[0]
	this.Data["usertableid"] = usertableid
	this.Data["id"] = id
	this.TplName = "editteacher.html"
}

func (this *UserController) DelTeacher() {
	id := this.GetParamAsInt("teacherid")
	err := models.DbOb.Exec(fmt.Sprintf(`delete from teacher where id=%d`, id))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "删除失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "删除成功", "")
	}
}

func (this *UserController) ToKBList() {
	id := this.GetSession("id")
	data, err := models.DbOb.Query(fmt.Sprintf("select * from productrecord left join product on productrecord.productid=product.id where userid=%s order by used asc,time desc", id))
	if err != nil {
		log.Println(err)
		this.Data["data"] = make([]map[string]string, 0)
	} else {
		this.Data["data"] = data
	}
	this.TplName = "kblist.html"
}

func (this *UserController) UsedKB() {
	code := this.GetParamAsSqlString("code")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from productrecord where code='%s'", code))
	if err != nil {
		this.Data["msg"] = "扫描失败，请重新扫描"
		this.Data["data"] = map[string]string{}
	} else {
		if len(d) == 0 {
			this.Data["msg"] = "无效二维码"
			this.Data["data"] = map[string]string{}
		} else if len(d) != 1 {
			this.Data["msg"] = "二维码存在异常，请与管理员联系"
			this.Data["data"] = map[string]string{}
		} else {
			data := d[0]
			if data["used"] != "0" {
				this.Data["msg"] = "此二维码已经使用"
			} else {
				err = models.DbOb.Exec(fmt.Sprintf("update productrecord set used=1,usedtime='%s' where code='%s'", this.GetDateTime(), code))
				if err != nil {
					this.Data["msg"] = "扫描失败，请重新扫描"
				} else {
					this.Data["msg"] = "扫码成功"
				}
			}
			this.Data["data"] = data
		}
	}
	this.TplName = "used.html"
}

var ntj = `select idcard,u.name,count(1) c from user u left join activity a on u.activityid=a.id where a.id is not null and idcard<>''
and substr(date(),0,5)= substr(a.time,0,5) and signbacktime is not null group by idcard
order by count(1) desc,name asc  limit 0,20`

var ytj = `select idcard,u.name,count(1) c from user u left join activity a on u.activityid=a.id where a.id is not null and idcard<>''
and substr(date(),0,8)= substr(a.time,0,8) and signbacktime is not null group by idcard
order by count(1) desc,name asc  limit 0,20`

func (this *UserController) Tj() {
	n, err := models.DbOb.Query(ntj)
	if err != nil {
		log.Println(err)
	}
	y, err := models.DbOb.Query(ytj)
	if err != nil {
		log.Println(err)
	}
	this.Data["ntj"] = n
	this.Data["ytj"] = y
	this.TplName = "tj.html"
}

var tjinfo = `select idcard,u.name,a.theme,substr(a.time,0,11) t from user u left join activity a on u.activityid=a.id where a.id is not null and idcard<>'' and substr(date(),0,%d)= substr(a.time,0,%d) and signbacktime is not null and idcard=%d order by a.id desc`

func (this *UserController) TjInfo() {
	id := this.GetParamAsInt("id")
	//1年度，2月度
	tjtype := this.GetParamAsInt("tj")
	sql := ""
	if tjtype == 1 {
		sql = fmt.Sprintf(tjinfo, 5, 5, id)
	} else {
		sql = fmt.Sprintf(tjinfo, 8, 8, id)
	}
	tjinfo, err := models.DbOb.Query(sql)
	if err != nil {
		log.Println(err)
	}
	this.Data["tjinfo"] = tjinfo
	this.TplName = "tjinfo.html"
}
