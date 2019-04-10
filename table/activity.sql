CREATE TABLE IF NOT EXISTS [activity] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[theme] text  NULL,
	[purpose] text  NULL,
	[content] text  NULL,
	[time] NVARCHAR(100)  NULL,
	[place] NVARCHAR(500)  NULL,
	[responsible] text  NULL,
	[peoplenum] NVARCHAR(100)  NULL,
	[peopleunit] NVARCHAR(100)  NULL
)