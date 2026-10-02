import apmNode from 'elastic-apm-node';

export let APM: any;

export const APMIsActive = Boolean(process.env.APM_SERVER && process.env.APM_APP_NAME);

if (APMIsActive) {
    APM = apmNode.start({
        serviceName: process.env.APM_APP_NAME,
        serverUrl: process.env.APM_SERVER,
    });
}
