CREATE TABLE IF NOT EXISTS [integrallog] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[userid1] INTEGER NULL,
	[username1] NVARCHAR(50)  NULL,
	[userid2] INTEGER NULL,
	[username2] NVARCHAR(50)  NULL,
	[integral1] DOUBLE  NULL,
	[integral2] DOUBLE  NULL,
	[addintegral] DOUBLE  NULL,
	[why] NVARCHAR(128)  NULL,
	[actiontime] NVARCHAR(64)  NULL,
	[eventid] INTEGER NULL,
	[reserved1] NVARCHAR(64)  NULL,
	[reserved2] NVARCHAR(64)  NULL,
	[reserved3] NVARCHAR(64)  NULL
)