'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;
const Homey = require('homey');

// Documentation: https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2293/IDL Operational Manual EN v1.3.pdf

class IDlock150 extends ZwaveDevice {	
	onMeshInit() {
		let unlockTrigger = new Homey.FlowCardTriggerDevice('lockstate');
		unlockTrigger.register();
		let awaymodeTrigger = new Homey.FlowCardTriggerDevice('awaymode');
		awaymodeTrigger.register();

		// enable debugging
		this.enableDebug();
	
		// print the node's info to the console
		this.printNode();

		//read out configuration for awaymode
		async function getAwaymode(thisVar){
				let awayConfig = await thisVar.configurationGet({index: 1}).catch( thisVar.error );
				thisVar.log(awayConfig['Configuration Value'][0]);
				if (awayConfig['Configuration Value'][0] === 2 || awayConfig['Configuration Value'][0] === 3){
					thisVar.log('awaymodeactive');
					awaymodeTrigger.trigger(thisVar, null, null).catch( thisVar.error ).then( thisVar.log('Awaymode active') )
				}		
		}
		
		this.registerCapability('locked', 'DOOR_LOCK', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			},
			report: 'DOOR_LOCK_OPERATION_REPORT',
			reportParserV2(report) {
				if (report && report.hasOwnProperty('Door Lock Mode')) {
					// reset alarm_tamper or alarm_heat based on Unlock report
					if (report['Door Lock Mode'] === 'Door Unsecured') {
						if (this.getCapabilityValue('alarm_tamper')) this.setCapabilityValue('alarm_tamper', false);
						if (this.getCapabilityValue('alarm_heat')) this.setCapabilityValue('alarm_heat', false);
						this.log('DOOR_LOCK: reset tamper and heat alarm');
					};
					return report['Door Lock Mode'] === 'Door Secured';
				}
				return null;
			},
		});

		this.registerCapability('locked', 'NOTIFICATION', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			},
			reportParser: report => {
				if (report && report['Notification Type'] === 'Access Control' && report.hasOwnProperty('Event (Parsed)')) {
					if (report['Event (Parsed)'] === 'Keypad Unlock Operation' &&
					report.hasOwnProperty('Event Parameter')) {
						let codes = JSON.parse(Homey.ManagerSettings.get('codes'));
						this.log("Codes", codes);
						let keyType = parseInt(report['Event Parameter'][0])
						if (keyType === 0 ){
							unlockTrigger.trigger(this, {"who":"Homey"}, null).catch( this.error ).then( this.log('Homey opened the door') )
						} else if (keyType === 1 ){
							unlockTrigger.trigger(this, {"who":"Master"},null).catch( this.error ).then( this.log('Master opened the door') )
						} else if (keyType === 2 ){
							unlockTrigger.trigger(this, {"who":"Service"},null).catch( this.error ).then( this.log('Service opened the door') )
						} else {
							let codes = JSON.parse(Homey.ManagerSettings.get('codes'));
							let keyId = keyType-59
							let type = parseInt(report['Event (Raw)'][0])
							let user = 'Unknown [key:'+keyId+']';
							this.log("Codes", codes);
							for(var i in codes){
								if (codes[i].index === keyId && codes[i].type=== type){
									user = codes[i].user;
								}
							}
							unlockTrigger.trigger(this, {"who":user},null).catch( this.error ).then( this.log('User opened the door') )
						}
					}
					if (report['Event (Parsed)'] === 'RF Unlock Operation' &&
					report.hasOwnProperty('Event Parameter')) {
						let codes = JSON.parse(Homey.ManagerSettings.get('codes'));
						let tagId = parseInt(report['Event Parameter'][0])-9
						let type = parseInt(report['Event (Raw)'][0])
						let user = 'Unknown [tag:'+tagId+']';
						this.log("Codes", codes);
						for(var i in codes){
							if (codes[i].index === tagId && codes[i].type=== type){
								user = codes[i].user;
							}
						}
					unlockTrigger.trigger(this, {"who":user},null).catch( this.error ).then( this.log('User opened the door') )
					}
					if (report['Event (Parsed)'] === 'Manual Unlock Operation') {
						unlockTrigger.trigger(this, {"who":"Button"}, null).catch( this.error ).then( this.log('Homey opened the door') )
					}
					if (report['Event (Parsed)'] === 'Manual Lock Operation') {
						//wait 20 sec then call function to check if away mode is activated and if active trigger flowcard.																													
						setTimeout(getAwaymode, 20000, this);
					}					
				}
				return null;
			}
		});

		this.registerCapability('alarm_contact', 'DOOR_LOCK', {
			get: 'DOOR_LOCK_OPERATION_GET',
			getOpts: {
				getOnStart: true,
			},
			report: 'DOOR_LOCK_OPERATION_REPORT',
			reportParserV2(report) {
				if (report && report.hasOwnProperty('Door Condition')) {
					this.log('Door Condition has changed:', report['Door Condition']);
					// check if Bit 0 is 1 (door closed) and return the inverse (alarm when door open)
					return !Boolean(report['Door Condition'] & 0b001);
				};
				return null;
			},
		});

		// register BATTERY capabilities
		this.registerCapability('measure_battery', 'BATTERY', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			}
		});

		this.registerCapability('alarm_battery', 'BATTERY');

		// register alarm capabilities for devices with COMMAND_CLASS_NOTIFICATION
		const commandClassNotification = this.getCommandClass('NOTIFICATION');
		if (!(commandClassNotification instanceof Error)) {
			this.registerCapability('alarm_tamper', 'NOTIFICATION', {
				getOpts: {
					getOnStart: true,
					getOnOnline: false,
				}
			});

			this.registerCapability('alarm_heat', 'NOTIFICATION', {
				get: 'NOTIFICATION_GET',
				getOpts: {
					getOnStart: true,
					getOnOnline: false,
				},
				getParser: () => ({
					'V1 Alarm Type': 0,
					'Notification Type': 'Emergency',
					Event: 2,
				}),
				report: 'NOTIFICATION_REPORT',
				reportParser: report => {
					if (report && report['Notification Type'] === 'Emergency' && report.hasOwnProperty('Event (Parsed)')) {
						if (report['Event (Parsed)'] === 'Contact Fire Service') return true;
						if (report['Event (Parsed)'] === 'Event inactive' &&
							report.hasOwnProperty('Event Parameter') &&
							(report['Event Parameter'][0] === 2 ||
								report['Event Parameter'][0] === 254)) {
							return false;
						}
					}
					return null;
				}
			});
			this.log('registered COMMAND_CLASS_NOTIFICATION capabilities listeners');
		}
		// register alarm capabilities for devices with COMMAND_CLASS_ALARM
		if (!(this.getCommandClass('ALARM') instanceof Error)) {
			this.registerCapability('alarm_tamper', 'ALARM', {
				get: 'ALARM_GET',
				getOpts: {
					getOnStart: true,
				},
				getParser: () => ({
					'Alarm Type': 10,
				}),
				report: 'ALARM_REPORT',
				reportParser: report => {
					if (report && report['Alarm Type'] === 10 && report.hasOwnProperty('Alarm Level')) {
						return report['Alarm Level'] === 1
					}
					return null;
				}
			});

			this.registerCapability('alarm_heat', 'ALARM', {
				get: 'ALARM_GET',
				getOpts: {
					getOnStart: true,
				},
				getParser: () => ({
					'Alarm Type': 4,
				}),
				report: 'ALARM_REPORT',
				reportParser: report => {
					if (report && report['Alarm Type'] === 4 && report.hasOwnProperty('Alarm Level')) {
						return report['Alarm Level'] === 1
					}
					return null;
				}
			});

			this.log('registered COMMAND_CLASS_ALARM capabilities listeners');
		}
	}
}
module.exports = IDlock150;