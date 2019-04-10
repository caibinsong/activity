CREATE TABLE IF NOT EXISTS [course] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[theme] text  NULL,
	[userid] text  NULL,
	[content] text  NULL,
	[time] NVARCHAR(256)  NULL,
	[integralnum] INTEGER  NULL,
	[place] NVARCHAR(500)  NULL,
	[usernum] INTEGER  NULL
)