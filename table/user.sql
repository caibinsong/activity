CREATE TABLE IF NOT EXISTS [user] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[activityid] int  NULL,
	[name] NVARCHAR(50)  NULL,
	[tel] NVARCHAR(20)  NULL,
	[idcard] NVARCHAR(64)  NULL,
	[time] NVARCHAR(100)  NULL,
	[signintime] NVARCHAR(100)  NULL,
	[signinname] NVARCHAR(100)  NULL,
	[signbacktime] NVARCHAR(100)  NULL,
	[signbackname] NVARCHAR(100)  NULL,
	[addintegral] DOUBLE null
)