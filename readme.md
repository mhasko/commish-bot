# Commish-Bot 

## What is Commish-Bot
Running a amateur league these days involves a lot of Discord functionality.  This bot will try to ease the harder parts of Discord administration.  This is exclusive to the CasualEAL.com league, but is configurable to other leagues.

## Commands
### !makeMatch
This command will create a private channel that only the roles of the two teams will have access to.  A wizard will guide the user through week number, division, home team and away team.

### !makepollcommand
This is a current hack to create the command line poll creation string for pollmaster, a different discord bot.  Admins can run this command then copy paste it into channels that need the match date poll.

### !makeProDraft
This command will allow a team captain to create a League of Legends ProDraft from the discord.  It takes 3 arguements, blue side tricode, red side tricode, and match title, and wraps that up in a POST to the prodraft site, then parses the response to create the links and throws them into the match channel.  The arguements can either be provided (!makeProDraft bva tft "Week 2 match") or the command can be entered on its own and commish-bot will prompt the user for the correct values

### !scheduleMatch
(In progress, not released yet) This team captain role will allow a team captain to report their match scheduled date to the admins and the casting team.  We're looking to hook this up directly with our casting calander.
