CREATE TABLE IF NOT EXISTS [courseuser] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[courseid] int  NULL,
	[userid] int  NULL,
	[name] NVARCHAR(50)  NULL,
	[tel] NVARCHAR(20)  NULL,
	[time] NVARCHAR(100)  NULL
)