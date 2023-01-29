drop database teamply;
create database teamply default character set utf8;
use teamply;
CREATE TABLE `Users` (
	`user_id`	bigint	NOT NULL auto_increment, 
    `user_hash` char(40) NOT NULL,
	`user_name`	varchar(25)	NOT NULL, 
	`user_email` varchar(50) NOT NULL, 
	`user_pw`	varchar(25)	NOT NULL, 
	`phone`	char(11) NOT NULL, 
	`accessConsent` int	NOT NULL, 
	`serviceConsent` int	NOT NULL, 
	`createIP`	bigint	NOT NULL, 
	`updateIP`	bigint	NOT NULL, 
	`activate`	int	NOT NULL, 
	`createAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (
        `user_id`, `user_hash`
    )
);

CREATE TABLE `Project` (
	`project_id`	bigint	NOT NULL auto_increment,
	`project_name`	varchar(50)	NOT NULL,
	`project_number` int	NOT NULL,
	`project_startAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`project_endAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`project_introduction`	varchar(100)	NOT NULL,
	`project_color`	varchar(25)	NOT NULL,
	`project_review`	varchar(100)	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (
        `project_id`
    )
);

CREATE TABLE `Schedule` (
	`schedule_id`	bigint	NOT NULL auto_increment,
	`project_id`	bigint	NOT NULL,
	`schedule_title`	varchar(100)	NOT NULL,
	`schedule_introduction`	varchar(100)	NOT NULL,
	`schedule_progress`	float8	NOT NULL,
	`schedule_duration`	int	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (
        `schedule_id`
    )
);

CREATE TABLE `UserInfo` (
	`user_id`	bigint	NOT NULL,
	`school`	varchar(30)	NOT NULL,
	`major`	varchar(30)	NOT NULL,
	`mbti`	char(4)	NOT NULL,
	`evaluation`	Int	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (
        `user_id`
    )
);

CREATE TABLE `UserReview` (
	`ureview_id`	bigint	NOT NULL auto_increment,
	`user_id`	bigint	NOT NULL,
	`user_id2`	bigint	NOT NULL,
	`project_id`	bigint	NOT NULL,
	`rater_id`	int	NOT NULL,
	`contents`	varchar(4000)	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (
        `ureview_id`
    )
);

CREATE TABLE `ProjectReview` (
	`preview_id`	bigint	NOT NULL auto_increment,
	`user_id`	bigint	NOT NULL,
	`project_id`	bigint	NOT NULL,
	`comments`	varchar(600)	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (
        `preview_id`
    )
);

CREATE TABLE `PhotoFile` (
	`file_id`	bigint	NOT NULL auto_increment,
	`user_id`	bigint	NOT NULL,
	`file_type`	varchar(50)	NOT NULL,
	`file_name`	varchar(255)	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (
        `file_id`
    )
);

CREATE TABLE `ProjectMember` (
	`user_id`	bigint	NOT NULL,
	`project_id`	bigint	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`user_id`, `project_id`
    )
);

CREATE TABLE `LogIn` (
	`id` bigint NOT NULL auto_increment,
	`user_id` bigint NOT NULL,
	`user_hash`	char(40)	NOT NULL,
	`loginIP`	bigint	NOT NULL,
	`plainText`	varchar(400)	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(
		`id`
    )
);

CREATE TABLE `ScheduleMember` (
	`user_id`	bigint	NOT NULL,
	`project_id`	bigint	NOT NULL,
	`schedule_id`	bigint	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
		`user_id`, `project_id`, `schedule_id`
    )
);

CREATE TABLE `Oauthid` (
	`id`	bigint	NOT NULL auto_increment,
	`user_id`	bigint	NOT NULL,
	`ersion`	bigint	NOT NULL,
	`access_token`	varchar(255)	NOT NULL,
	`provider`	varchar(200)	NOT NULL,
	`createAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updateAt`	datetime	NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(
		`id`
    )
);

ALTER TABLE `Schedule` ADD CONSTRAINT `FK_project_TO_schedule_1` FOREIGN KEY (
	`project_id`
)
REFERENCES `Project` (
	`project_id`
);

ALTER TABLE `UserInfo` ADD CONSTRAINT `FK_user_TO_UsersInfo_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `Users` (
	`user_id`
);

ALTER TABLE `UserReview` ADD CONSTRAINT `FK_projectMember_TO_UsersReview_1` FOREIGN KEY (
	`user_id`, `project_id`
)
REFERENCES `ProjectMember` (
	`user_id`, `project_id`
);


ALTER TABLE `UserReview` ADD CONSTRAINT `FK_user_TO_UsersReview_1` FOREIGN KEY (
	`user_id2`
)
REFERENCES `Users` (
	`user_id`
);

ALTER TABLE `ProjectReview` ADD CONSTRAINT `FK_projectMember_TO_projectReview_1` FOREIGN KEY (
	`user_id`, `project_id`
)
REFERENCES `ProjectMember` (
	`user_id`, `project_id`
);

ALTER TABLE `PhotoFile` ADD CONSTRAINT `FK_user_TO_photoFile_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `Users` (
	`user_id`
);

ALTER TABLE `ProjectMember` ADD CONSTRAINT `FK_user_TO_projectMember_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `Users` (
	`user_id`
);

ALTER TABLE `ProjectMember` ADD CONSTRAINT `FK_project_TO_projectMember_1` FOREIGN KEY (
	`project_id`
)
REFERENCES `Project` (
	`project_id`
);

ALTER TABLE `LogIn` ADD CONSTRAINT `FK_user_TO_logIn_1` FOREIGN KEY (
	`user_id`, `user_hash`
)
REFERENCES `Users` (
	`user_id`, `user_hash`
);

ALTER TABLE `ScheduleMember` ADD CONSTRAINT `FK_projectMember_TO_scheduleMember_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `ProjectMember` (
	`user_id`
);

ALTER TABLE `ScheduleMember` ADD CONSTRAINT `FK_projectMember_TO_scheduleMember_2` FOREIGN KEY (
	`project_id`
)
REFERENCES `ProjectMember` (
	`project_id`
);

ALTER TABLE `ScheduleMember` ADD CONSTRAINT `FK_schedule_TO_scheduleMember_1` FOREIGN KEY (
	`schedule_id`
)
REFERENCES `Schedule` (
	`schedule_id`
);

ALTER TABLE `Oauthid` ADD CONSTRAINT `FK_user_TO_Oauthid_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `Users` (
	`user_id`
);

