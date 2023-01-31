drop database teamply;
create database teamply default character set utf8;
use teamply;

CREATE TABLE `Users` (
	`user_id`	bigint	NOT NULL auto_increment,
	`user_hash`	char(40) NOT NULL,
	`user_name`	varchar(30)	NOT NULL,
	`user_email` varchar(50)	NOT NULL,
	`user_pw` varchar(30)	NOT NULL,
	`phone`	char(11) NOT NULL,
	`accessConstent` int NOT NULL,
	`serviceConsent` int NOT NULL,
	`createIP`	bigint	NOT NULL,
	`updateIP`	bigint	NOT NULL,
	`activate`	int	NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`user_id`, `user_hash`
    )
);

CREATE TABLE `Project` (
	`proj_id`	bigint	NOT NULL auto_increment,
	`proj_hash`	char(40) NOT NULL,
	`proj_name`	varchar(50)	NOT NULL,
	`proj_headcount` int NOT NULL,
	`proj_startAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`proj_endAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`proj_intro` varchar(100) NOT NULL,
	`proj_review` varchar(200) NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`proj_id`, `proj_hash`
    )
);

CREATE TABLE `Schedule` (
	`sch_id` bigint	NOT NULL auto_increment,
	`proj_id` bigint NOT NULL,
	`sch_title`	varchar(100) NULL,
	`sch_intro`	varchar(100) NULL,
	`sch_progress`	float8 NULL,
	`sch_startAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`sch_endAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`sch_id`
    )
);

CREATE TABLE `UserInfo` (
	`user_id` bigint NOT NULL auto_increment,
	`user_hash`	char(40) NOT NULL,
	`school` varchar(30) NOT NULL,
	`major`	varchar(30)	NOT NULL,
	`mbti`	char(4)	NOT NULL,
	`evaluation` int NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`user_id`, `user_hash`
    )
);

CREATE TABLE `UserReview` (
	`ur_id`	bigint	NOT NULL auto_increment,
	`reviewer_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`proj_id` bigint NOT NULL,
	`comments`	varchar(600) NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`ur_id`
	)
);

CREATE TABLE `ProjReview` (
	`pr_id`	bigint	NOT NULL auto_increment,
	`user_id`	bigint	NOT NULL,
	`proj_id`	bigint	NOT NULL,
	`comments`	varchar(600) NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`pr_id`
    )
);

CREATE TABLE `PhotoFile` (
	`file_id` bigint NOT NULL auto_increment,
	`user_id` bigint NOT NULL,
	`user_hash`	char(40) NULL,
	`file_type`	varchar(50)	NULL,
	`file_name`	varchar(255) NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`file_id`
    )
);

CREATE TABLE `ProjectMember` (
	`user_id`	bigint	NOT NULL,
	`proj_id`	bigint	NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`color`	varchar(10)	NOT NULL,
    PRIMARY KEY(
		`user_id`, `proj_id`
    )
);

CREATE TABLE `LogIn` (
	`login_id` bigint NOT NULL auto_increment,
	`user_id` bigint NOT NULL,
	`user_hash` char(40) NOT NULL,
	`loginIP` bigint NULL,
	`plainText` varchar(30)	NULL,
	`createAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`login_id`
    )
);

CREATE TABLE `ScheduleMember` (
	`user_id` bigint NOT NULL auto_increment,
	`sch_id` bigint	NOT NULL,
	`proj_id` bigint NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`user_id`, `sch_id`, `proj_id`
    )
);

CREATE TABLE `OauthId` (
	`id` bigint	NOT NULL auto_increment,
	`user_id` bigint NOT NULL,
	`user_hash`	char(40)NOT NULL,
	`ersion` bigint	NOT NULL,
	`access_token` varchar(300)	NOT NULL,
	`provider`	varchar(200) NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`id`
	)
);

CREATE TABLE `Alarm` (
	`alarm_id` bigint NOT NULL auto_increment,
	`user_id` bigint NOT NULL,
	`sch_id` bigint	NOT NULL,
	`proj_id` bigint NOT NULL,
	`createAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`alarm_id`
	)
);

CREATE TABLE `UserBias` (
	`id` bigint NOT NULL auto_increment,
	`user_id` bigint NOT NULL,
	`contents`	varchar(120) NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`id`
    )
);

CREATE TABLE `ProjInvite` (
	`in_hash` char(9) NOT NULL,
	`proj_id` bigint NOT NULL,
	`proj_hash`	char(40) NOT NULL,
	`is_timeless` int NOT NULL,
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`in_hash`
	)
);

# table setting end 

# foreign key setting
ALTER TABLE `Schedule` ADD CONSTRAINT `FK_Project_TO_Schedule_1` FOREIGN KEY (
	`proj_id`
)
REFERENCES `Project` (
	`proj_id`
);

ALTER TABLE `UserInfo` ADD CONSTRAINT `FK_Users_TO_UserInfo_1` FOREIGN KEY (
	`user_id`, `user_hash`
)
REFERENCES `Users` (
	`user_id`, `user_hash`
);

ALTER TABLE `UserReview` ADD CONSTRAINT `FK_Users_TO_UserReview_1` FOREIGN KEY (
	`reviewer_id`
)
REFERENCES `Users` (
	`user_id`
);

ALTER TABLE `UserReview` ADD CONSTRAINT `FK_ProjectMember_TO_UserReview_1` FOREIGN KEY (
	`user_id`, `proj_id`
)
REFERENCES `ProjectMember` (
	`user_id`, `proj_id`
);

ALTER TABLE `ProjReview` ADD CONSTRAINT `FK_ProjectMember_TO_ProjReview_1` FOREIGN KEY (
	`user_id`, `proj_id`
)
REFERENCES `ProjectMember` (
	`user_id`, `proj_id`
);

ALTER TABLE `PhotoFile` ADD CONSTRAINT `FK_Users_TO_PhotoFile_1` FOREIGN KEY (
	`user_id`, `user_hash`
)
REFERENCES `Users` (
	`user_id`, `user_hash`
);

ALTER TABLE `ProjectMember` ADD CONSTRAINT `FK_Users_TO_ProjectMember_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `Users` (
	`user_id`
);

ALTER TABLE `ProjectMember` ADD CONSTRAINT `FK_Project_TO_ProjectMember_1` FOREIGN KEY (
	`proj_id`
)
REFERENCES `Project` (
	`proj_id`
);

ALTER TABLE `LogIn` ADD CONSTRAINT `FK_Users_TO_LogIn_1` FOREIGN KEY (
	`user_id`, `user_hash`
)
REFERENCES `Users` (
	`user_id`, `user_hash`
);

ALTER TABLE `ScheduleMember` ADD CONSTRAINT `FK_ProjectMember_TO_ScheduleMember_1` FOREIGN KEY (
	`user_id`, `proj_id`
)
REFERENCES `ProjectMember` (
	`user_id`, `proj_id`
);

ALTER TABLE `ScheduleMember` ADD CONSTRAINT `FK_Schedule_TO_ScheduleMember_1` FOREIGN KEY (
	`sch_id`
)
REFERENCES `Schedule` (
	`sch_id`
);

ALTER TABLE `OauthId` ADD CONSTRAINT `FK_Users_TO_OauthId_1` FOREIGN KEY (
	`user_id`, `user_hash`
)
REFERENCES `Users` (
	`user_id`, `user_hash`
);

ALTER TABLE `Alarm` ADD CONSTRAINT `FK_ScheduleMember_TO_Alarm_1` FOREIGN KEY (
	`user_id`, `sch_id`, `proj_id`
)
REFERENCES `ScheduleMember` (
	`user_id`, `sch_id`, `proj_id`
);

ALTER TABLE `UserBias` ADD CONSTRAINT `FK_Users_TO_UserBias_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `Users` (
	`user_id`
);

ALTER TABLE `ProjInvite` ADD CONSTRAINT `FK_Project_TO_ProjInvite_1` FOREIGN KEY (
	`proj_id`, `proj_hash`
)
REFERENCES `Project` (
	`proj_id`, `proj_hash`
);

show tables;