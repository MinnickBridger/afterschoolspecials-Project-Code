import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Amplify, { API, graphqlOperation, Auth } from 'aws-amplify';
import aws_exports from './aws-exports';
import { withAuthenticator } from 'aws-amplify-react';
import { Button, Container, Icon, Label, Input, Dimmer, Loader, Segment } from 'semantic-ui-react';
Amplify.configure(aws_exports);

class App extends Component {
  constructor() {
    super()
    this.state = {
      hasLoadedBudget: false,
      user: null,
      budget: null
    }
    this.getUserBudget = this.getUserBudget.bind(this)
    this.createUserBudget = this.createUserBudget.bind(this)
    Auth.currentAuthenticatedUser()
      .then(user => {
        console.log(user)
        this.setState({ user }, () => {
          this.getUserBudget()
        })

      })
      .then(data => console.log(data))
      .catch(err => console.log(err));
  }
  componentDidMount() {
    document.title = 'Expense App'
  }

  render() {
    const { user, hasLoadedBudget, budget } = this.state
    // if (user) {
    //   return (
    //     <div className="App">
    //       <body>
    //         <Label>{JSON.stringify(user)}</Label>
    //       </body>
    //     </div>
    //   )
    // }
    if (!hasLoadedBudget) {
      return (
        <div className="App">
          <body>
            <Container>
              <Label>Loading budget...</Label>
            </Container>
          </body>
        </div>
      )
    }

    if (budget) {
      return (
        <div className="App">
          <body>
            <Container>
              <Label>{JSON.stringify(budget)}</Label>
            </Container>
          </body>
        </div>
      );
    } else {
      return (
        <div className="App">
          <body>
            <Container>
              <div style={{ marginTop: 10 }}>
                <Label>Let's create your first budget!</Label>
              </div>
              <div style={{ marginTop: 10 }}>
                <Button onClick={this.createUserBudget} primary>Create!</Button>
              </div>
            </Container>
          </body>
        </div>
      );
    }
  }

  getUserBudget() {
    // Simple query
    const userBudgetQuery = `query ($userId: String) {
      listUserBudgets(filter: {userID: {eq: $userId}}) {
        items {
          id
          userID
          categories {
            title
            precent
            lineItems {
              id
              price
            }
          }
        }
      }
    }`
    const { user } = this.state

    const parameters = { "userId": user.pool.clientId }
    API.graphql(graphqlOperation(userBudgetQuery, parameters))
      .then(results => {
        console.log("MJV results => ", JSON.stringify(results))
        const data = results.data.listUserBudgets.items
        if (data.length > 0) {
          const FIRST = 0
          this.setState({ budget: data[FIRST] })
        }
        this.setState({ hasLoadedBudget: true })
      })
      .catch(err => {
        console.log("MJV ERROR => ", err)
      })

  }

  createUserBudget() {
    const userBudgetQuery = `mutation ($userId: String!) {
      createUserBudget(input: {userID: $userId}) {
        id
        userID
      }
    }`
    const { user } = this.state

    const parameters = { "userId": user.pool.clientId }
    API.graphql(graphqlOperation(userBudgetQuery, parameters))
      .then(results => {
        this.getUserBudget()
      })
      .catch(err => {
        console.log("MJV ERROR => ", err)
      })
  }
}

export default withAuthenticator(App, true);
