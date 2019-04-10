CREATE TABLE IF NOT EXISTS [caogao] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[userid] INTEGER  NULL,
	[theme] text  NULL,
	[purpose] text  NULL,
	[content] text  NULL,
	[time] NVARCHAR(100)  NULL,
	[time1] NVARCHAR(100)  NULL,
	[place] NVARCHAR(500)  NULL,
	[responsible] text  NULL,
	[peoplenum] NVARCHAR(100)  NULL,
	[peopleunit] NVARCHAR(100)  NULL
)