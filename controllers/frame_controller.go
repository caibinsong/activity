package controllers

import (
	"../models"
	"code.google.com/p/mahonia"
	"encoding/json"
	"fmt"
	"github.com/tealeg/xlsx"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type FrameController struct {
	ywcontroller
}

func (this *FrameController) Foot() {
	this.Data["status"] = this.GetParamAsInt("status")
	this.TplName = "foot.html"
}

func (this *FrameController) ToLogin() {
	this.TplName = "login.html"
}
func (this *FrameController) ToAdminLogin() {
	this.TplName = "adminlogin.html"
}

func (this *FrameController) setSession(data map[string]string) {
	this.SetSession("id", data["id"])
	this.SetSession("user", data["user"])
	this.SetSession("pwd", data["pwd"])
	this.SetSession("name", data["name"])
	this.SetSession("tel", data["tel"])
	this.SetSession("permissions", data["permissions"])
}

func (this *FrameController) delSession() {
	this.DelSession("id")
	this.DelSession("user")
	this.DelSession("pwd")
	this.DelSession("name")
	this.DelSession("tel")
	this.DelSession("permissions")
}

func (this *FrameController) Outlogin() {
	this.delSession()
	this.TplName = "adminlogin.html"
}

func (this *FrameController) Outlogin2() {
	this.delSession()
	this.Data["out"] = this.GetParamAsInt("out")
	this.TplName = "login.html"
}

func (this *FrameController) Login() {
	username := this.GetParamAsSqlString("username")
	password := this.GetParamAsSqlString("password")
	//用户名加密码
	user, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where user='%s' and pwd='%s'", username, password))
	if err != nil {
		log.Println(err.Error())
		this.ReturnJsonString(0, "登录失败，请刷新", "")
		return
	}
	if len(user) == 0 {
		this.ReturnJsonString(0, "用户名或密码不正确", "")
	} else if len(user) == 1 {
		models.DbOb.Exec(fmt.Sprintf("update usertable set lastlogintime='%s' where id=%s", this.GetDateTime(), user[0]["id"]))
		this.setSession(user[0])
		this.ReturnJsonString(1, "登录成功", "")
	} else {
		this.ReturnJsonString(0, "帐号存在异常，请联系管理员", "")
	}
}

func (this *FrameController) ToIndex() {
	if this.GetSession("permissions") != "3" {
		this.TplName = "adminlogin.html"
	} else {
		this.TplName = "index.html"
	}
}

func (this *FrameController) ToChangepwd() {
	this.TplName = "changepwd.html"
}

func (this *FrameController) getyiqihome(introducename string) map[string]string {
	data, err := models.DbOb.Query(fmt.Sprintf("select * from introduce where introducename='%s'", introducename))
	if err != nil {
		log.Println(err)
		return map[string]string{}
	} else {
		return data[0]
	}
}

//到后台益启之家编辑界面
func (this *FrameController) ToEditYiQiHomeInfo() {
	this.Data["data"] = this.getyiqihome(this.GetParamAsSqlString("introducename"))
	this.TplName = "edityiqihomeinfo.html"
}

//保存益启之家信息
func (this *FrameController) SaveYiQiHomeInfo() {
	introducename := this.GetParamAsSqlString("introducename")
	head := this.GetParamAsSqlString("head")
	content := this.GetParamAsSqlString("content")
	err := models.DbOb.Exec(fmt.Sprintf("update introduce set title='%s',content='%s',time='%s' where introducename='%s'", head, content, this.GetDateTime(), introducename))
	if err != nil {
		this.ReturnString(this.jsonString(0, "保存失败，请刷新", err.Error()))
	} else {
		this.ReturnString(this.jsonString(1, "保存成功", ""))
	}
}

//到前台显示益启之家界面
func (this *FrameController) ToShowYiQiHomeInfo() {
	this.Data["data"] = this.getyiqihome(this.GetParamAsSqlString("introducename"))
	this.TplName = "yiqihomeinfo.html"
}

//修改密码
func (this *FrameController) Changepwd() {
	oldpwd := this.GetParamAsSqlString("oldpwd")
	newpwdf := this.GetParamAsSqlString("newpwd1")
	newpwds := this.GetParamAsSqlString("newpwd2")
	if oldpwd == "" || newpwdf == "" || newpwds == "" {
		this.ReturnString(this.jsonString(0, "密码不可为空", ""))
		return
	}
	if newpwdf != newpwds {
		this.ReturnString(this.jsonString(0, "两次密码不一致", ""))
		return
	}

	if oldpwd == this.GetSession("pwd") {
		err := models.DbOb.Exec(fmt.Sprintf("update usertable set pwd='%s' where id='%s'", newpwdf, this.GetSession("id")))
		if err != nil {
			this.ReturnString(this.jsonString(0, "密码保存出错", err.Error()))
		} else {
			this.ReturnString(this.jsonString(1, "修改成功", ""))
		}
	} else {
		this.ReturnString(this.jsonString(0, "原密码不正确", ""))
	}
}

////活动  ok
func (this *FrameController) List() {
	this.Data["permissions"] = this.GetPermissions()
	this.TplName = "list.html"
}

func (this *FrameController) ToListPage() {
	this.TplName = "activitylist.html"
}

func (this *FrameController) GetList2() {
	pagesize := this.GetParamAsInt("pageSize")
	pageindex := this.GetParamAsInt("pageIndex")
	if pagesize == 0 {
		pagesize = 20
	}
	theme := this.GetParamAsSqlString("theme")
	r, err := models.DbOb.QueryTableList(fmt.Sprintf("select * from activity where theme like '%%%s%%' order by id desc", theme), pageindex, pagesize)
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "", "")
	} else {
		bt, _ := json.Marshal(r)
		this.ReturnString(string(bt))
	}
}

//导出讲师
func (this *FrameController) ExportSigninList() {
	result, err := models.DbOb.Query(fmt.Sprintf("select * from user where activityid=%d", this.GetParamAsInt("id")))

	file := xlsx.NewFile()
	sheet, _ := file.AddSheet("Sheet1")
	row := sheet.AddRow()
	row.SetHeightCM(1) //设置每行的高度
	cell := row.AddCell()
	cell.Value = "序号"
	cell = row.AddCell()
	cell.Value = "姓名"
	cell = row.AddCell()
	cell.Value = "手机号"
	cell = row.AddCell()
	cell.Value = "本人报名"
	cell = row.AddCell()
	cell.Value = "报名时间"
	cell = row.AddCell()
	cell.Value = "签到时间"
	cell = row.AddCell()
	cell.Value = "签到人员"
	cell = row.AddCell()
	cell.Value = "签退时间"
	cell = row.AddCell()
	cell.Value = "签退人员"
	cell = row.AddCell()
	cell.Value = "积分"
	for _, onemap := range result {
		row := sheet.AddRow()
		row.SetHeightCM(1) //设置每行的高度
		cell := row.AddCell()
		cell.Value = onemap["xhid"]
		cell = row.AddCell()
		cell.Value = onemap["name"]
		cell = row.AddCell()
		cell.Value = onemap["tel"]
		cell = row.AddCell()
		if onemap["idcard"] == "" {
			cell.Value = "否"
		} else {
			cell.Value = "是"
		}
		cell = row.AddCell()
		cell.Value = onemap["time"]
		cell = row.AddCell()
		cell.Value = onemap["signintime"]
		cell = row.AddCell()
		cell.Value = onemap["signiname"]
		cell = row.AddCell()
		cell.Value = onemap["signbacktime"]
		cell = row.AddCell()
		cell.Value = onemap["signbackname"]
		cell = row.AddCell()
		cell.Value = onemap["addintegral"]
	}
	excelpath := "./export/" + this.GetParamAsSqlString("theme") + "_签到签退单" + this.GetDateTimeStr() + ".xlsx"
	err = file.Save(excelpath)
	if err != nil {
		this.ReturnString("导出失败，请重试")
		return
	}
	enc := mahonia.NewEncoder("gbk")
	gbkfile := enc.ConvertString(this.GetParamAsSqlString("theme") + "_签到签退单.xlsx")
	this.Ctx.ResponseWriter.Header().Set("Content-Disposition", "attachment;filename="+gbkfile)
	http.ServeFile(this.Ctx.ResponseWriter, this.Ctx.Request, excelpath)
}

func (this *FrameController) GetList() {
	pagesize := this.GetParamAsInt("pageSize")
	pageindex := this.GetParamAsInt("pageIndex")
	if pagesize == 0 {
		pagesize = 20
	}
	theme := this.GetParamAsSqlString("theme")
	r, err := models.DbOb.QueryTableList(fmt.Sprintf("select * from activity where theme like '%%%s%%' order by id desc", theme), pageindex, pagesize)
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "", "")
	} else {
		this.ReturnJsonString(1, "", r)
	}
}

func (this *FrameController) ToDelUser() {
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from user where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	this.TplName = "deluser.html"
}

func (this *FrameController) DelUser() {
	id := this.GetParamAsInt("id")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	} else {
		models.DbOb.Exec(fmt.Sprintf("delete from user where id=%d", id))
		this.ReturnJsonString(1, "", "")
	}
}

func (this *FrameController) ToDel() {
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from activity where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	this.TplName = "del.html"
}

func (this *FrameController) SigninList() {
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from user where activityid=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d
	} else {
		this.Data["data"] = make([]map[string]string, 0)
	}
	this.TplName = "signinlist.html"
}

func (this *FrameController) Del() {
	id := this.GetParamAsInt("id")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	} else {
		models.DbOb.Exec(fmt.Sprintf("delete from activity where id=%d", id))
		this.ReturnJsonString(1, "", "")
	}
}
func (this *FrameController) Toadd() {
	userid := this.GetSession("id").(string)
	dd, err := models.DbOb.Query(fmt.Sprintf("select theme,purpose,content,time,time1,place,responsible,peoplenum from caogao where userid=%s", userid))
	if err != nil {
		log.Println(err)
		this.Data["data"] = map[string]string{"time": ""}
	} else {
		if len(dd) == 0 {
			this.Data["data"] = map[string]string{"time": ""}
		} else {
			this.Data["data"] = dd[0]
		}
	}
	this.TplName = "add.html"
}

func (this *FrameController) CaoGao() {
	userid := this.GetSession("id").(string)
	theme := this.GetParamAsSqlString("theme")
	purpose := this.GetParamAsSqlString("purpose")
	content := this.GetParamAsSqlString("content")
	time := this.GetParamAsSqlString("time")
	time1 := this.GetParamAsSqlString("time1")
	place := this.GetParamAsSqlString("place")
	responsible := this.GetParamAsSqlString("responsible")
	peoplenum := this.GetParamAsSqlString("peoplenum")

	dd, err := models.DbOb.Query(fmt.Sprintf("select * from caogao where userid=%s", userid))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "保存失败", "")
		return
	}
	if len(dd) == 0 {
		err := models.DbOb.Exec(fmt.Sprintf(`insert into caogao(userid,theme,purpose,content,time,time1,place,responsible,peoplenum) values(%s,'%s','%s','%s','%s','%s','%s','%s','%s')`, userid, theme, purpose, content, time, time1, place, responsible, peoplenum))
		if err != nil {
			log.Println(err)
			this.ReturnJsonString(0, "保存失败", "")
			return
		} else {
			this.ReturnJsonString(1, "保存成功", "")
			return
		}
	} else {
		err := models.DbOb.Exec(fmt.Sprintf(`update caogao set theme='%s',purpose='%s',content='%s',time='%s',time1='%s',place='%s',responsible='%s',peoplenum='%s' where userid=%s`, theme, purpose, content, time, time1, place, responsible, peoplenum, userid))
		if err != nil {
			log.Println(err)
			this.ReturnJsonString(0, "保存失败", "")
			return
		} else {
			this.ReturnJsonString(1, "保存成功", "")
			return
		}
	}
}

func (this *FrameController) Add() {
	userid := this.GetSession("id").(string)
	theme := this.GetParamAsSqlString("theme")
	purpose := this.GetParamAsSqlString("purpose")
	content := this.GetParamAsSqlString("content")
	time := this.GetParamAsSqlString("time")
	place := this.GetParamAsSqlString("place")
	responsible := this.GetParamAsSqlString("responsible")
	peoplenum := this.GetParamAsSqlString("peoplenum")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	}
	models.DbOb.Exec(fmt.Sprintf("delete from caogao where userid=%s", userid))
	time = strings.Replace(time, "T", " ", -1)
	if this.GetParamAsInt("id") == 0 {
		err := models.DbOb.Exec(fmt.Sprintf("insert into activity(theme,purpose,content,time,place,responsible,peoplenum) values('%s','%s','%s','%s','%s','%s','%s')",
			theme, purpose, content, time, place, responsible, peoplenum))
		if err != nil {
			log.Println(err.Error())
			this.ReturnJsonString(0, "添加失败，请刷新", "")
		} else {
			this.ReturnJsonString(1, "添加成功", "")
		}
	} else {
		err := models.DbOb.Exec(fmt.Sprintf("update activity set theme='%s',purpose='%s',content='%s',time='%s',place='%s',responsible='%s',peoplenum='%s' where id=%d",
			theme, purpose, content, time, place, responsible, peoplenum, this.GetParamAsInt("id")))
		if err != nil {
			log.Println(err.Error())
			this.ReturnJsonString(0, "修改失败，请刷新", "")
		} else {
			this.ReturnJsonString(1, "修改成功", "")
		}
	}
}

//ok
func (this *FrameController) Show() {
	this.Data["permissions"] = this.GetPermissions()
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from activity where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	dd, err := models.DbOb.Query(fmt.Sprintf("select * from user where activityid=%d order by time asc", id))
	now := time.Now()
	t := strings.Replace(models.DateSpF(d[0]["time"]), "T", " ", 1)

	st, err := time.Parse("2006-01-02 15:04", t)
	if err != nil {
		this.Data["bm"] = false
	} else {
		st = st.Add(-time.Second * 60 * 60 * 8)
		if now.Sub(st) > 0 {
			this.Data["bm"] = true
		} else {
			this.Data["bm"] = false
		}
	}
	this.Data["userlist"] = dd
	this.TplName = "show.html"
}

//ok
func (this *FrameController) ToEdit() {
	this.Data["permissions"] = this.GetPermissions()
	id := this.GetParamAsInt("id")
	d, err := models.DbOb.Query(fmt.Sprintf("select * from activity where id=%d", id))
	if err != nil {
		log.Println(err)
	}
	if len(d) > 0 {
		this.Data["data"] = d[0]
	} else {
		this.Data["data"] = make(map[string]string)
	}
	this.TplName = "add.html"
}
func (this *FrameController) AddUser() {
	name := this.GetParamAsSqlString("name")
	tel := this.GetParamAsSqlString("tel")
	id := this.GetParamAsInt("id")
	otheruser := this.GetParamAsString("otheruser")
	userid := this.GetSession("id")
	uid := ""
	if userid != nil {
		uid = userid.(string)
	}
	if otheruser == "false" && userid == nil {
		this.ReturnJsonString(0, "tologin", "")
		return
	}
	if otheruser == "true" {
		uid = ""
	} else {
		c, err := models.DbOb.Query(fmt.Sprintf("select count(1) num from user where activityid=%d and idcard=%s", id, uid))
		log.Println(c, err)
		if c[0]["num"] != "0" {
			this.ReturnJsonString(0, "不可重复报名", "")
			return
		}
		name = this.GetSession("name").(string)
		tel = this.GetSession("tel").(string)
	}

	err := models.DbOb.Exec(fmt.Sprintf("insert into user(activityid,name,tel,idcard,time) values(%d,'%s','%s','%s','%s')", id, name, tel, uid, this.GetDateTime()))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "报名人太多，请刷新重试", "")
	} else {
		this.ReturnJsonString(1, "", "")
	}
}

func (this *FrameController) UploadImg() {
	file, fileheader, err := this.GetFile("file")
	if err != nil {
		this.ReturnString(this.jsonString(0, err.Error(), ""))
		return
	}
	defer func() {
		if file != nil {
			file.Close()
		}
	}()
	filename := filepath.Base(fileheader.Filename)
	index := strings.LastIndex(filename, ".")
	ext := filename[index+1:]
	if this.IsImgExt(ext) {
		this.ReturnString(this.jsonString(0, "仅可上传jpg、gif、png文件", ""))
		return
	}
	//把文件保存到临时目录
	b, err := ioutil.ReadAll(file)
	if err != nil {
		log.Println(err)
		this.ReturnString(this.jsonString(0, "导入失败", ""))
		return
	}
	filepath := "./imgfile/" + fmt.Sprintf("%d.%s", time.Now().UnixNano(), ext)
	ioutil.WriteFile(filepath, b, 0x644)
	this.ReturnString(`{"status": 1,"url": "` + filepath[1:] + `"}`)
}
func (this *FrameController) BatSignin() {
	idlist := this.GetParamAsSqlString("v")
	arrid := strings.Split(idlist, ";;;")
	name := this.GetSession("name").(string)
	//signintime,signinname,signbacktime,signbackname,addintegral
	for _, id := range arrid {
		if id == "" {
			continue
		}
		err := models.DbOb.Exec(fmt.Sprintf("update user set signintime='%s',signinname='%s' where id=%s", this.GetDateTime(), name, id))
		if err != nil {
			log.Println(err)
		}
	}
	this.ReturnJsonString(1, "签到成功", "")
}
func (this *FrameController) Signin() {
	id := this.GetParamAsInt("id")
	name := this.GetSession("name").(string)
	//signintime,signinname,signbacktime,signbackname,addintegral
	err := models.DbOb.Exec(fmt.Sprintf("update user set signintime='%s',signinname='%s' where id=%d", this.GetDateTime(), name, id))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "签到失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "签到成功", "")
	}
}
func (this *FrameController) Signback() {
	id := this.GetParamAsInt("id")
	name := this.GetSession("name").(string)
	//signintime,signinname,signbacktime,signbackname,addintegral
	err := models.DbOb.Exec(fmt.Sprintf("update user set signbacktime='%s',signbackname='%s' where id=%d", this.GetDateTime(), name, id))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "签退失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "签退成功", "")
	}
}

func (this *FrameController) ToAddIntegral() {
	this.Data["id"] = this.GetParamAsInt("id")
	this.Data["showid"] = this.GetParamAsInt("showid")
	this.Data["name"] = this.GetParamAsSqlString("name")
	this.TplName = "addintegral.html"
}

func (this *FrameController) AddIntegral() {
	id := this.GetParamAsInt("id")
	addintegral := this.GetParamAsSqlString("addintegral")
	bmuserinfo, err := models.DbOb.Query(fmt.Sprintf("select u.*,a.theme from user u left join activity a on u.activityid=a.id where u.id=%d", id))
	if err != nil || len(bmuserinfo) == 0 {
		log.Println(err)
		log.Println("bmuserinfo len", len(bmuserinfo))
		this.ReturnJsonString(0, "积分增加失败，请刷新", "")
		return
	}
	if bmuserinfo[0]["idcard"] != "" {
		//查询当前用户信息
		d, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where id=%s", bmuserinfo[0]["idcard"]))
		if err != nil {
			log.Println(err.Error())
			this.ReturnJsonString(0, "修改失败，请刷新", "")
			return
		}
		if len(d) == 1 {
			f_addintegral, err1 := strconv.ParseFloat(addintegral, 64)
			f_integral, err2 := strconv.ParseFloat(d[0]["integral"], 64)
			if err1 != nil || err2 != nil {
				log.Println(err1)
				log.Println(err2)
				f_addintegral = 0
				f_integral = 0
				log.Println(fmt.Sprintf("%.1f", f_addintegral+f_integral))
			}
			//添加积分记录
			err = models.DbOb.Exec(fmt.Sprintf(`insert into integrallog(userid1,username1,userid2,username2,integral1,integral2,addintegral,why,actiontime,eventid) 
				values(%s,'%s',%s,'%s',%s,%s,%s,'%s','%s',%s)`,
				this.GetSession("id").(string), this.GetSession("name").(string),
				d[0]["id"], d[0]["name"],
				d[0]["integral"], fmt.Sprintf("%.1f", f_addintegral+f_integral), addintegral,
				"参加 "+bmuserinfo[0]["theme"]+" 活动，增加积分", this.GetDateTime(), bmuserinfo[0]["activityid"]))
			if err != nil {
				log.Println(err)
			}
		}
		//用户表加分
		err = models.DbOb.Exec(fmt.Sprintf("update usertable set integral=integral+%s where id='%s'", addintegral, bmuserinfo[0]["idcard"]))
		if err != nil {
			log.Println(err)
			this.ReturnJsonString(0, "积分增加失败，请刷新", "")
			return
		}
	}
	//报名表加分
	err = models.DbOb.Exec(fmt.Sprintf("update user set addintegral='%s' where id=%d", addintegral, id))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "积分增加失败，请刷新", "")
	} else {
		this.ReturnJsonString(1, "积分增加成功", "")
	}
}

func (this *FrameController) ToBatSignback() {
	this.Data["id"] = this.GetParamAsInt("id")
	this.TplName = "batsignback.html"
}

func (this *FrameController) BatSignback() {
	id := this.GetParamAsInt("id")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	}
	name := this.GetSession("name").(string)
	err := models.DbOb.Exec(fmt.Sprintf("update user set signbacktime='%s',signbackname='%s' where signintime is not null and signbacktime is null and activityid=%d", this.GetDateTime(), name, id))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "签退失败，请刷新", "")
		return
	}
	this.ReturnJsonString(1, "操作成功", "")
}

func (this *FrameController) ToBatAdd() {
	this.Data["id"] = this.GetParamAsInt("id")
	this.TplName = "bataddintegral.html"
}

func (this *FrameController) BatAdd() {
	id := this.GetParamAsInt("id")
	num := this.GetParamAsSqlString("num")
	pwd := this.GetParamAsSqlString("pwd")
	if pwd != models.SysCon.Pwd {
		this.ReturnJsonString(0, "管理员密码不正确", "")
		return
	}
	userlist, err := models.DbOb.Query(fmt.Sprintf("select ifnull(GROUP_CONCAT(idcard),0) idlist from user where activityid=%d and signbacktime is not null and addintegral is null and idcard>0", id))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "操作失败，请重新登录", "")
		return
	}
	bmuserinfo, err := models.DbOb.Query(fmt.Sprintf("select u.*,a.theme from user u left join activity a on u.activityid=a.id where u.activityid=%d", id))
	if err != nil || len(bmuserinfo) == 0 {
		log.Println(err)
		log.Println("bmuserinfo len", len(bmuserinfo))
		this.ReturnJsonString(0, "积分增加失败，请刷新", "")
		return
	}
	//每个用户
	arrusrid := strings.Split(userlist[0]["idlist"], ",")
	for _, oneuserid := range arrusrid {
		if oneuserid == "" {
			continue
		}
		d, err := models.DbOb.Query(fmt.Sprintf("select * from usertable where id=%s", oneuserid))
		if err != nil {
			log.Println(err.Error())
			this.ReturnJsonString(0, "修改失败，请刷新", "")
			return
		}
		if len(d) == 1 {
			f_addintegral, err1 := strconv.ParseFloat(num, 64)
			f_integral, err2 := strconv.ParseFloat(d[0]["integral"], 64)
			if err1 != nil || err2 != nil {
				log.Println(err1)
				log.Println(err2)
				f_addintegral = 0
				f_integral = 0
				log.Println(fmt.Sprintf("%.1f", f_addintegral+f_integral))
			}
			//添加积分记录
			err = models.DbOb.Exec(fmt.Sprintf(`insert into integrallog(userid1,username1,userid2,username2,integral1,integral2,addintegral,why,actiontime,eventid) 
				values(%s,'%s',%s,'%s',%s,%s,%s,'%s','%s',%s)`,
				this.GetSession("id").(string), this.GetSession("name").(string),
				d[0]["id"], d[0]["name"],
				d[0]["integral"], fmt.Sprintf("%.1f", f_addintegral+f_integral), num,
				"参加 "+bmuserinfo[0]["theme"]+" 活动，增加积分", this.GetDateTime(), bmuserinfo[0]["activityid"]))
			if err != nil {
				log.Println(err)
			}
		}
	}
	//end
	err = models.DbOb.Exec(fmt.Sprintf("update user set addintegral=%s where activityid=%d and signbacktime is not null and addintegral is null and idcard>0", num, id))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "积分增加失败，请刷新", "")
		return
	}
	err = models.DbOb.Exec(fmt.Sprintf("update usertable set integral=integral+%s where id in (%s)", num, userlist[0]["idlist"]))
	if err != nil {
		log.Println(err)
		this.ReturnJsonString(0, "积分增加失败，请刷新", "")
		return
	}
	this.ReturnJsonString(1, "操作成功", "")
}

func (this *FrameController) UploadFile() {
	fileid := this.GetParamAsSqlString("fileid")
	file, fileheader, err := this.GetFile(fileid)
	if err != nil {
		this.ReturnString(this.jsonString(0, err.Error(), ""))
		return
	}
	defer func() {
		if file != nil {
			file.Close()
		}
	}()
	filename := filepath.Base(fileheader.Filename)
	index := strings.LastIndex(filename, ".")
	ext := filename[index+1:]

	//把文件保存到临时目录
	b, err := ioutil.ReadAll(file)
	if err != nil {
		log.Println(err)
		this.ReturnString(this.jsonString(0, "上传失败", ""))
		return
	}
	filepath := "./imgfile/" + fmt.Sprintf("%d.%s", time.Now().UnixNano(), ext)
	err = ioutil.WriteFile(filepath, b, 0x644)
	this.ReturnString(this.jsonString(1, "上传成功", strings.TrimLeft(filepath, ".")))
}
