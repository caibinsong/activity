CREATE TABLE IF NOT EXISTS [product] (
	[id] INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
	[type] NVARCHAR(500)  NULL,
	[title] text  NULL,
	[img] text  NULL,
	[des] text  NULL,
	[imgdes] text  NULL,
	[sponsors] text  NULL,
	[rules] text  NULL,
	[place] NVARCHAR(500)  NULL,
	[integral] DOUBLE  NULL,
	[num] INTEGER  NULL,
	[inventory] INTEGER  NULL,
	[status] INTEGER  NULL
)