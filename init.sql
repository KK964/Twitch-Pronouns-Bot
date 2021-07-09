create database if not exists TwitchPronounsBot;
use TwitchPronounsBot;
create table if not exists pronouns (user_id bigint not null primary key, pronouns varchar(255));