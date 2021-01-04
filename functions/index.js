const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
const db = admin.firestore();

function normalizeParams({ session, intent }) {
    const params = session.params;
    const today = new Date();
    const paddedMonth = String(today.getMonth() + 1).padStart(2, '0');
    const paddedDay = String(today.getDate()).padStart(2, '0');
    const reqTime = params.timestamp && params.timestamp.resolved;
    const time = reqTime ? Date.parse(`${today.getFullYear()}-${paddedMonth}-${paddedDay} ${reqTime.hours}:${reqTime.minutes}:${reqTime.seconds}`) : today.getTime();
    reqTime && functions.logger.info(`${today.getFullYear()}-${paddedMonth}-${paddedDay} ${reqTime.hours}:${reqTime.minutes}:${reqTime.seconds}`, { structuredData: true });

    return {
        // TODO: implement other types of food
        type: 'formula',
        kind: params.diaperKind || 'dirty',
        ...params,
        time: new Date(time),
        intent,
    };
}

async function logFood(params, session, response) {
    await db.collection('food').add({
        original_query: params.intent,
        name: params.name,
        time: params.time,
        quantity: params.quantity,
        type: params.type,
        // TODO: implement
        notes: '',
    });

    return response.json({
        session,
        prompt: {
            override: false,
            firstSimple: {
                speech: `Logged ${params.quantity} ounces for ${params.name}.`,
            },
        },
        scene: {
            name: 'SceneName',
            slots: {},
            next: {
                name: 'actions.scene.END_CONVERSATION',
            },
        },
    });
}

async function logDiapers(params, session, response) {
    await db.collection('diapers').add({
        original_query: params.intent,
        name: params.name,
        time: params.time,
        kind: params.kind,
        // TODO: implement
        notes: '',
    });

    return response.json({
        session,
        prompt: {
            override: false,
            firstSimple: {
                speech: `Logged ${params.kind} diaper for ${params.name}`,
            },
        },
        scene: {
            name: 'SceneName',
            slots: {},
            next: {
                name: 'actions.scene.END_CONVERSATION',
            },
        },
    });
}

async function logSleep(params, session, response, status) {
    await db.collection('sleep').add({
        original_query: params.intent,
        name: params.name,
        time: params.time,
        status,
        // TODO: implement
        notes: '',
    });

    return response.json({
        session,
        prompt: {
            override: false,
            firstSimple: {
                speech: status === 'sleep' ? `Logged that ${params.name} is asleep` : `Logged that ${params.name} is awake`,
            },
        },
        scene: {
            name: 'SceneName',
            slots: {},
            next: {
                name: 'actions.scene.END_CONVERSATION',
            },
        },
    });
}

exports.babyLog = functions.https.onRequest(async (request, response) => {
    functions.logger.info(request.body.session, { structuredData: true });

    const params = normalizeParams(request.body);
    const session = {
        id: request.body.session.id,
        params: request.body.session.params,
    };

    switch (request.body.handler.name) {
        case 'logFood':
            return await logFood(params, session, response);
        case 'logDiapers':
            return await logDiapers(params, session, response);
        case 'logSleep':
            return await logSleep(params, session, response, 'sleep');
        case 'logAwake':
            return await logSleep(params, session, response, 'awake');
        default:
            return response.json({
                session,
                prompt: {
                    override: false,
                    firstSimple: {
                        speech: 'No handler matched',
                    },
                },
                scene: {
                    name: 'SceneName',
                    slots: {},
                    next: {
                        name: 'actions.scene.END_CONVERSATION',
                    },
                },
            });
    }
});
