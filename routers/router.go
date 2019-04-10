package routers

import (
	"../controllers"
	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/", &controllers.FrameController{}, "*:List") //登录页面
	beego.AutoRouter(&controllers.FrameController{})            //系统类
	beego.AutoRouter(&controllers.UserController{})
	beego.AutoRouter(&controllers.DynamicController{})
	beego.AutoRouter(&controllers.CourseController{})
	beego.AutoRouter(&controllers.ProductController{})
}
