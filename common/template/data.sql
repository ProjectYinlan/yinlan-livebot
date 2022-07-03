--
-- 由SQLiteStudio v3.3.3 产生的文件 周日 7月 3 17:15:14 2022
--
-- 文本编码：System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- 表：auditList
CREATE TABLE auditList (eventId INTEGER PRIMARY KEY UNIQUE NOT NULL, type STRING NOT NULL, fromId INTEGER NOT NULL, groupId INTEGER, groupName STRING, nick STRING, message STRING, ts INTEGER NOT NULL, status STRING NOT NULL CHECK (status = 'pending' or status = 'accept' or status = 'deny' or status = 'ignore' or status = 'autoAccept'));

-- 表：liveroom_group
CREATE TABLE liveroom_group (uid INTEGER NOT NULL REFERENCES liverooms (uid), groupId INTEGER NOT NULL, atAll INTEGER DEFAULT (0) NOT NULL);

-- 表：liverooms
CREATE TABLE liverooms (uid INTEGER PRIMARY KEY UNIQUE NOT NULL, roomId INTEGER, uname STRING NOT NULL, status INTEGER NOT NULL, ts INTEGER NOT NULL, pending INTEGER NOT NULL, flag INTEGER NOT NULL);

-- 表：stats
CREATE TABLE stats ("key" STRING PRIMARY KEY NOT NULL UNIQUE, value INTEGER NOT NULL);
INSERT INTO stats ("key", value) VALUES ('pushCount', 0);
INSERT INTO stats ("key", value) VALUES ('onlineTime', 0);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
