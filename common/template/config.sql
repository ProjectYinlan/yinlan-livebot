--
-- 由SQLiteStudio v3.3.3 产生的文件 周日 7月 3 17:15:05 2022
--
-- 文本编码：System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- 表：managers
CREATE TABLE managers (id INTEGER PRIMARY KEY UNIQUE, role STRING);

-- 表：numberConfig
CREATE TABLE numberConfig ("key" STRING PRIMARY KEY UNIQUE, value INTEGER);
INSERT INTO numberConfig ("key", value) VALUES ('startTime', 1656837933676);
INSERT INTO numberConfig ("key", value) VALUES ('autoAcceptGroup', 0);
INSERT INTO numberConfig ("key", value) VALUES ('autoAcceptFriend', 0);
INSERT INTO numberConfig ("key", value) VALUES ('biliCheckInterval', 60);
INSERT INTO numberConfig ("key", value) VALUES ('biliCheckMode', 0);

-- 表：statusConfig
CREATE TABLE statusConfig ("key" STRING PRIMARY KEY UNIQUE NOT NULL, value INTEGER NOT NULL);
INSERT INTO statusConfig ("key", value) VALUES ('broadcastStatus', 0);

-- 表：stringConfig
CREATE TABLE stringConfig ("key" STRING PRIMARY KEY UNIQUE, value STRING);
INSERT INTO stringConfig ("key", value) VALUES ('name', NULL);
INSERT INTO stringConfig ("key", value) VALUES ('broadcastResult', NULL);
INSERT INTO stringConfig ("key", value) VALUES ('biliCheckAccount', NULL);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
