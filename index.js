//

const { ZBClient } = require('zeebe-node');
const { GraphQLClient, gql } = require('graphql-request');
const { feel } = require('js-feel')();

// Configuration settings from the environment.
const GRAPHQL_ENDPOINT_URL = process.env.GRAPHQL_ENDPOINT_URL;
const GRAPHQL_AUTHORIZATION_HEADER_KEY = process.env.GRAPHQL_AUTHORIZATION_HEADER_KEY;
const GRAPHQL_AUTHORIZATION_HEADER_VALUE = process.env.GRAPHQL_AUTHORIZATION_HEADER_VALUE;
const ZEEBE_TASK_TYPE = process.env.ZEEBE_TASK_TYPE || 'graphql';

// Create the Zeebe Client, which pulls in ENV configuration.
const zbc = new ZBClient({
    onReady: () => console.log(`Zeebe Connected`),
    onConnectionError: () => console.log(`Zeebe Disconnected`)
});

// Create the GraphQL Client
const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT_URL, {
    headers: {
        [GRAPHQL_AUTHORIZATION_HEADER_KEY]: GRAPHQL_AUTHORIZATION_HEADER_VALUE,
    }
});

// Create the Zeebe Job Handler.
const handler = async (job, complete, worker) => {
    try {
        // We begin by getting the query data from the job
        console.log(job);
        const dataKey = job.customHeaders.graphql_data_key;
        const queryStr = job.customHeaders.graphql_query;
        const query = gql([queryStr], []);
        // This is the data from the job we're making available for the FEEL expressions.
        const feelContext = {
            zeebeKey: job.key,
            zeebeTaskType: job.type,
            zeebeWorkflowInstanceKey: job.workflowInstanceKey,
            zeebeProcessInstanceKey: job.processInstanceKey,
            zeebeBpmnProcessId: job.bpmnProcessId,
            zeebeWorkflowDefinitionVersion: job.workflowDefinitionVersion,
            zeebeProcessDefinitionVersion: job.processDefinitionVersion,
            zeebeWorkflowKey: job.workflowKey,
            zeebeProcessKey: job.processKey,
            zeebeElementId: job.elementId,
            zeebeElementInstanceKey: job.elementInstanceKey,
            ...(job.variables)
        };
        // We iterate through each custom header to form the variables that we
        // pass to the graphql query.
        // These come from headers whose key begins with `graphql_var_`
        // Any header whose value begins with `=` will be FEEL evaluated
        // Otherwise, the literal value will be used.
        // The graphql variable names are the header key string without the
        // `graphql_var_` prefix.
        const variables = {};
        for (let key in job.customHeaders) {
            if (key.startsWith('graphql_var_') && key.length > 12) {
                varKey = key.substring(12);
                const value = job.customHeaders[key] || '';
                if (value.startsWith('=')) {
                    // Any Error by the feel evaluation will throw an error,
                    // and will fail this job.
                    const rule = value.substring(1);
                    const parsedGrammar = feel.parse(rule);
                    const result = await parsedGrammar.build(feelContext);
                    variables[varKey] = result;
                } else {
                    // Use the literal string as the value.
                    variables[varKey] = value;
                }
            }
        }
        // console.log(variables);

        // We make the GraphQL Request
        const data = await gqlClient.request(query, variables);
        // console.log(data);

        // A success is returning the data back to Zeebe, as nested
        // under a given key, or merged into the root Zeebe Process Instance
        // variables.
        complete.success((dataKey && dataKey.length > 0) ? ({ [dataKey]: data }) : data);
    } catch(err) {
        console.error(err);
        complete.failure(err);
    }
};

// The Zeebe Job Worker to take a job, execute its embedded graphql query
// and return the success information.
const zbWorker = zbc.createWorker({
    taskType: ZEEBE_TASK_TYPE,
    taskHandler: handler,
    onReady: () => console.log(`Zeebe Worker Connected`),
    onConnectionError: () => console.log(`Zeebe Worker Disconnected`)
});
