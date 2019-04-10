package main

import (
	"./models"
	_ "./routers"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"
)

//退出时延时
func onExit() {
	runtime.UnlockOSThread()
	nWaitSecond := 8
	log.Println("******程序", nWaitSecond, "秒钟后自动退出******")
	time.Sleep(time.Duration(nWaitSecond) * time.Second)
	os.Exit(-1)
}

//主程序
func main() {
	models.GetLogWriter().SetLogFile("./file.log")
	log.SetFlags(log.Lshortfile | log.LstdFlags)
	log.SetOutput(models.GetLogWriter())
	log.Println("开启启动程序......")
	defer onExit()

	runtime.LockOSThread()

	os.Chdir(filepath.Dir(os.Args[0]))

	BeegoConfig()

	err := models.LoadSysConfig()
	if err != nil {
		log.Panic(err.Error())
	}
	//注册函数
	models.RegistFuncMap()

	//循环测试连接，等待连接成功
	errdbinit := models.DbOb.InitDbCache()
	if errdbinit != nil {
		log.Panic(errdbinit.Error())
	}
	models.Work()
	//开始WEB服务
	log.Println("程序启动完成,HTTP服务启动,端口:", beego.BConfig.Listen.HTTPPort, "......")
	beego.BConfig.WebConfig.Session.SessionGCMaxLifetime = 32140800
	beego.BConfig.Listen.AdminPort = 8882
	beego.BConfig.WebConfig.Session.SessionName = "yigongsession"
	for {
		beego.Run()
		time.Sleep(10 * time.Second)
	}
}

func BeegoConfig() {
	//beego日志设置
	beego.SetLevel(2)
	beego.SetLogFuncCall(true)
	beego.BeeLogger.SetLogger("console", "")
	beego.BeeLogger.SetLogger("file", `{"filename":"goweb.log","maxlines":1000000,"daily":true}`)
	beego.BConfig.Listen.EnableAdmin = true
	//静态文件注册
	beego.SetStaticPath("/pages", "./views")
	beego.SetStaticPath("/images", "./views/images")
	beego.SetStaticPath("/imgs", "./views/imgs")
	beego.SetStaticPath("/img", "./views/img")
	beego.SetStaticPath("/css", "./views/css")
	beego.SetStaticPath("/upload", "./upload")
	beego.SetStaticPath("/js", "./views/js")
	beego.SetStaticPath("/js1", "./views/js1")
	beego.SetStaticPath("/mapdata", "./views/mapdata")
	beego.SetStaticPath("/AmazeUI-2.4.2", "./views/AmazeUI-2.4.2")
	beego.SetStaticPath("/basic", "./views/basic")
	beego.SetStaticPath("/common", "./views/common")
	beego.SetStaticPath("/less", "./views/less")
	beego.SetStaticPath("/v2", "./views/v2")
	beego.SetStaticPath("/map", "./views/map")
	beego.SetStaticPath("/imgfile", "./imgfile")

	//session过滤
	beego.InsertFilter("*", beego.BeforeRouter, sessionfilter)
}

//进行session检查
var sessionfilter = func(ctx *context.Context) {
	requrl := ctx.Request.URL.Path
	log.Println(requrl)
	//未登录可用
	var safeUrls []string = []string{"/",
		"/frame/toshowyiqihomeinfo", //简介
		"/frame/list",               //活动页面
		"/frame/getlist",            //活动信息
		"/frame/show",               //活动展示
		"/frame/adduser",            //活动报名
		"/dynamic/list",             //动态页面
		"/dynamic/getlist",          //动态信息列表
		"/dynamic/show",             //动态展示
		"/course/list",              //课堂页面
		"/course/getlist",           //课堂信息列表
		"/course/show",              //课堂展示
		"/user/toshowteacherlist",   //讲师团队
		"/user/teacherlist",         //讲师团队
		"/user/showteacher",         //讲师团队
		"/frame/foot",               //底部
		"/user/add",                 //用户注册
		"/user/toregistered",        //用户注册页面
		"/user/toresetpass",         //忘记密码页面
		"/user/reset",               //重置密码
		"/frame/tologin",            //登录页面
		"/frame/toadminlogin",       //后台登录页面
		"/user/usedkb",
		"/user/tj",
		"/user/tjinfo",
		"/frame/login"} //用户登录

	for _, v := range safeUrls {
		if v == requrl {
			return
		}
	}
	toLoginUrl := "<script language='javascript'>window.top.location.href='/frame/tologin';</script>"
	u, ok := ctx.Input.Session("id").(string)
	if !ok || u == "" {
		ctx.WriteString(toLoginUrl)
	}
}

//判断文件夹是否存在
func isDirExists(path string) bool {
	fi, err := os.Stat(path)
	if err != nil {
		return os.IsExist(err)
	}
	return fi.IsDir()
}

type LogWriter struct {
	locker sync.Mutex
}

func (this *LogWriter) Write(b []byte) (int, error) {
	//打印
	return len(b), nil
}
