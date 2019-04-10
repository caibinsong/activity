CREATE TABLE IF NOT EXISTS [dynamic] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[title] text  NULL,
	[author] text  NULL,
	[content] text  NULL,
	[time] NVARCHAR(100)  NULL,
	[field0] text  NULL,
	[field1] text  NULL,
	[field2] NVARCHAR(100)  NULL,
	[field3] INTEGER  NULL
)