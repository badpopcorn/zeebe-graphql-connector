# zeebe-graphql-connector

A Zeebe Job Worker that will execute GraphQL queries/mutations based on the
task.

# Configuring the Zeebe Service Task

In Camunda Cloud, one can:

1. Set the Service Task Type to `graphql`
2. Set the Retries to some number
3. Add a header with `graphql_query` key with a GraphQL query/mutation value.
4. Add any variables in the headers, prefixed with `graphql_var_`, to signify
  a variable to be passed along with the GraphQL request. Note that the
  prefix is removed for the actual request. For example, the header
  `graphql_var_id` will be named `id` in the GraphQL request.
5. If the value of any graphql var header begins with a `=` character,
  the this job worker will evaluate the string as a FEEL expression.
  Otherwise, it is assumed to be a string literal.
  The context of the FEEL express are the Process Instance's variables,
  merged with some Zeebe Job variables (prefixed with `zeebe`).

The feelContext:

```
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
```

# Running the Worker

The following environment variables are used by the app.

```
export ZEEBE_ADDRESS='camunda.cloud.zeebe.api.domain.name:443'
export ZEEBE_CLIENT_ID='...[camunda cloud client id]...'
export ZEEBE_CLIENT_SECRET='...[camunda cloud client secret]...'
export GRAPHQL_ENDPOINT_URL='https://my-project-00.hasura.app/v1/graphql'
export GRAPHQL_AUTHORIZATION_HEADER_KEY='x-hasura-admin-secret'
export GRAPHQL_AUTHORIZATION_HEADER_VALUE='...'
export ZEEBE_TASK_TYPE=graphql
```

Note that `ZEEBE_TASK_TYPE` environment variable is the same as the service
task type defined in the Zeebe BPMN activity.

Just start the server:

```
node index.js
```
