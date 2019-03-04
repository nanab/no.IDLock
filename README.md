# ID Lock Z-wave

This app adds support for ID Lock Z-wave devices made by [ID Lock AS](https://idlock.no/).

## Links:
[ID Lock app Athom apps](https://apps.athom.com/app/no.IDLock)                    
[ID Lock Github repository](https://github.com/TedTolboom/no.IDLock)   

## Supported devices
* ID Lock 101 (incl. Z-Wave module board 01A)   
* ID Lock 150 (incl. Z-Wave module board 01A)    

## Supported Languages:
* English

## ID Lock 101 & 150 Features

The ID Lock 101 / ID Lock 150 driver supports the following capabilities:
* Door lock / unlocked
* Door open / closed (contact alarm)
* Heat alarm
* Tamper alarm
* Battery (alarm)

Triggers:
* Someone unlocked the door (ID Lock 150 only)
* Door lock / unlocked
* Generic "an alarm triggered" trigger cards from devices, with additional logic AND condition isolating device

Actions:
* Door lock / unlock
* Disable awaymode (There is a bug in zwave module that doesnt disable awaymode if unlocked by homey. ID Lock 150 only)

Conditions:
* Awaymode active (ID Lock 150 only)

## Feedback:
Any requests please post them in the [ID Lock app topic on the Homey community Forum](https://community.athom.com/t/161) or contact me on [Slack](https://athomcommunity.slack.com/team/tedtolboom)   

## Change Log:
### V 1.2.5
* Add support for checking if awaymode is active.

### v 1.2.0
* Add support for registering user codes and recognizing who unlocked the door (for ID Lock 150) (credits to Mats Paulsen)      
* Minor (cosmetical) modifications to make the app Homey SW v2.0.0 compatible      
* Update meshdriver to version 1.2.28   

### v 1.1.0
* Add support for ID Lock 150         
* Update meshdriver to version 1.2.22   

### v 1.0.2
* Administrative update; add link to community forum topic       

### v 1.0.1
* Remove (and overrule) default `getOnOnline` triggers to try to resolve battery draining issue    

### v 1.0.0
* App store release for ID lock 101 (including Z-Wave module board 01A)

## Future work:
* ID Lock 101: Device specific alarm triggers flow cards (incl. door open state)   
* ID Lock 101: Notification cards providing tokens with door unlock condition (manual, RFID, keypad etc)   
* ID Lock 150: Device specific alarm triggers flow cards (incl. door open state)   
* ~ ID Lock 150: Notification cards providing tokens with door unlock condition (manual, RFID, keypad etc) ~   
* ~ Add support for ID Lock 150 ~   
