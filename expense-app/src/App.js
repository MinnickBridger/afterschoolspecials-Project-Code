import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Amplify, { API, graphqlOperation, Auth } from 'aws-amplify';
import aws_exports from './aws-exports';
import { withAuthenticator } from 'aws-amplify-react';
import { Button, Container, Icon, Label, Input, Dimmer, Loader, Segment, Divider, Grid, Header, Form, Message, Modal } from 'semantic-ui-react';
Amplify.configure(aws_exports);

class App extends Component {
  constructor() {
    super()
    this.state = {
      hasLoadedBudget: false,
      user: null,
      budget: null,
      categorySelectedForDelete: null,
      newBudgetMax: '',
      newCategoryTitle: "",
      newCategoryPrecent: "",
      newExpensePrice: "",
      newExpenseDesc: "",
      newExpenseCategory: null,
      creatingCategory: false,
      creatingCategoryError: null,
      creatingExpense: false,
      modalOpen: false
    }
    this.newCategoryTitleInput = React.createRef();
    this.newCategoryPrecentInput = React.createRef();
    this.newExpenseDescInput = React.createRef();
    this.newExpensePriceInput = React.createRef();
    this.getUserBudget = this.getUserBudget.bind(this)
    this.createUserBudget = this.createUserBudget.bind(this)
    this.createCategory = this.createCategory.bind(this)
    this.createExpense = this.createExpense.bind(this)
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

  handleNewExpenseCategoryChange = (e, { value }) => this.setState({ newExpenseCategory: value })

  calculateTotal = (category) => {
    let total = 0.0
    category.lineItems.forEach(lineItem => {
      total = total + lineItem.price
    })
    return total
  }



  render() {
    const { user, hasLoadedBudget, budget, creatingCategory, creatingExpense, newCategoryPrecent, newCategoryTitle, newExpenseCategory, newExpensePrice, newExpenseDesc, creatingCategoryError, creatingExpenseError } = this.state

    if (!hasLoadedBudget) {
      return (
        <div className="App">
          <body style={{ paddingTop: 15 }}>
            <Container>
              <Label>Loading budget...</Label>
            </Container>
          </body>
        </div>
      )
    }

    if (budget) {
      const budgetCategories = budget.categories.map((category, index) =>
        <Container key={category.id} style={{ marginBottom: 20 }}>
          <Divider horizontal>{category.title}<Label>%{(category.precent * 100).toFixed(0)} (${category.precent * budget.maxBudget})</Label>
            <Modal trigger={<Button color="red" circular size="mini" onClick={() => {
              this.setState({ categorySelectedForDelete: category }, () => {
                this.handleOpen()
              })
            }} ><Icon name="trash" /> delete </Button>}
              open={this.state.modalOpen}
              onClose={this.handleClose}
              basic
              size='small'
            >
              <Header icon='trash' content='Delete Category' />
              <Modal.Content>
                <p>
                  Are you sure you want to delete this category and all the expenses with it?
</p>
              </Modal.Content>
              <Modal.Actions>
                <Button onClick={this.handleClose} basic color='red' inverted>
                  <Icon name='remove' /> No
</Button>
                <Button color='green' inverted onClick={() => {
                  this.deleteCategory(this.state.categorySelectedForDelete)
                  this.handleClose()
                }}>
                  <Icon name='checkmark' /> Yes
</Button>
              </Modal.Actions>
            </Modal>
          </Divider>
          {this.isOverBudget(category) && <Message negative>
            <Message.Header>Oops... Over budget!</Message.Header>
            <p>Check to see what you spent too much on below</p>
          </Message>}
          {category.lineItems.map(lineItem => {
            return (
              <p>{lineItem.title} - ${lineItem.price.toFixed(2)}</p>
            )
          })}
          <Header>
            <Header.Subheader style={{ fontWeight: '800' }}>Total Spent: ${this.calculateTotal(category).toFixed(2)}</Header.Subheader>
            <Header.Subheader style={{ fontWeight: '600', color: this.isOverBudget(category) ? 'red' : 'gray' }}>Left: ${(this.calculateRemaining(category))}</Header.Subheader>
          </Header>
        </Container>
      )
      return (
        <div className="App">
          <body style={{ paddingTop: 15 }}>
            <div style={{ margin: 10 }}>
              <Label>Total Monthly Budget: ${budget.maxBudget}</Label>
            </div>
            <div>
              <Button onClick={() => {
                this.deleteUserBudget()
              }} style={{ backgroundColor: '#e74c3c', color: 'white' }}>Restart monthly budget</Button>
            </div>
            <Segment style={{ marginLeft: 10, marginRight: 10, marginTop: 10 }}>
              <Grid columns={2} textAlign='center'>
                <Divider vertical>OR</Divider>
                <Grid.Row padded verticalAlign='middle'>
                  <Grid.Column>
                    <Header icon>
                      <Icon name='plus' />
                      New Category
          </Header>
                    <Form loading={creatingCategory} onSubmit={(e) => {
                      this.createCategory()
                    }}>
                      <Message info>
                        <Message.Header>{this.calculateRemainingTotalBudget().toFixed(0)}% remaining of total budget</Message.Header>
                        <Message.Content></Message.Content>
                      </Message>
                      {creatingCategoryError && <Message negative>
                        <Message.Header>{creatingCategoryError}</Message.Header>
                        <Message.Content></Message.Content>
                      </Message>}
                      <Form.Field>
                        <Input value={newCategoryTitle} fluid placeholder="title" onChange={(e, { value }) => {
                          this.setState({ newCategoryTitle: value })
                        }} />
                      </Form.Field>
                      <Form.Field>
                        <Input value={newCategoryPrecent} placeholder="Percent ex. 0.3" onChange={(e, { value }) => {
                          this.setState({ newCategoryPrecent: value })
                        }} />
                      </Form.Field>
                      <Form.Button disabled={!this.canCreateCategory()} fluid primary type="submit">Create</Form.Button>
                    </Form>
                  </Grid.Column>

                  <Grid.Column>
                    <Header icon>
                      <Icon name='dollar sign' />
                      New Expense
          </Header>
                    <Form loading={creatingExpense}>
                      {creatingExpenseError && <Message negative>
                        <Message.Header>{creatingExpenseError}</Message.Header>
                        <Message.Content></Message.Content>
                      </Message>}
                      <Form.Field>
                        <Input value={newExpenseDesc} onChange={(e, { value }) => {
                          this.setState({ newExpenseDesc: value })
                        }} placeholder="Expense desc." />
                      </Form.Field>
                      <Form.Field>
                        <Input value={newExpensePrice} onChange={(e, { value }) => {
                          this.setState({ newExpensePrice: value })
                        }} placeholder="price ex. 4.43" />
                      </Form.Field>
                      <Form.Field>
                        {budget.categories.map(category => {
                          return (
                            <div>
                              <Form.Radio
                                fitted
                                label={category.title}
                                value={category.id}
                                checked={newExpenseCategory === category.id}
                                onChange={this.handleNewExpenseCategoryChange}
                              />
                            </div>
                          )
                        })}
                      </Form.Field>
                      <Form.Button disabled={budget.categories.length < 1} fluid type='submit' onClick={this.createExpense} primary>Create</Form.Button>
                    </Form>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>
            {budgetCategories}
          </body>
        </div>
      );
    } else {
      return (
        <div className="App">
          <body style={{ paddingTop: 15 }}>
            <Container>
              <div>
                <Label>Let's create your monthly budget!</Label>
              </div>
              <div style={{ marginTop: 10 }}>
                <Input error={isNaN(this.state.newBudgetMax)} label="$" placeholder="Enter your monthly budget" fluid onChange={(e, { value }) => {
                    this.setState({ newBudgetMax: value })
                }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <Button disabled={isNaN(this.state.newBudgetMax) || this.state.newBudgetMax == ''} onClick={this.createUserBudget} primary>Create!</Button>
              </div>
            </Container>
          </body>
        </div>
      );
    }
  }

  handleOpen = () => this.setState({ modalOpen: true })

  handleClose = () => this.setState({ modalOpen: false })

  calculateRemainingTotalBudget = () => {
    const { budget } = this.state
    let totalPrecent = 1.0
    budget.categories.forEach(category => {
      totalPrecent = totalPrecent - category.precent
    })

    return Math.abs(totalPrecent * 100)
  }

  canCreateCategory = () => {
    return (this.calculateRemainingTotalBudget() <= 0) ? false : true
  }

  calculateRemaining = (category) => {
    return (this.calculateCategoryTotal(category.precent) - this.calculateTotal(category)).toFixed(2)
  }
  isOverBudget = (category) => {
    const { budget } = this.state
    return ((this.calculateCategoryTotal(category.precent) - this.calculateTotal(category)).toFixed(2) < 0) ? true : false
  }
  calculateCategoryTotal = (precent) => {
    const { budget } = this.state
    return budget.maxBudget * precent
  }

  getUserBudget() {
    // Simple query
    const userBudgetQuery = `query ($userId: String) {
      listUserBudgets(filter: {userID: {eq: $userId}}) {
        items {
          id
          maxBudget
          userID
          categories {
            id
            title
            precent
            lineItems {
              id
              title
              price
            }
          }
        }
      }
    }`
    const { user } = this.state

    const parameters = { "userId": user.username }
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
    const userBudgetQuery = `mutation ($userId: String!, $maxBudget: Float!) {
      createUserBudget(input: {userID: $userId, maxBudget: $maxBudget}) {
        id
        userID
        maxBudget
      }
    }`
    const { user, newBudgetMax } = this.state

    const parameters = { "userId": user.username, "maxBudget": newBudgetMax }
    API.graphql(graphqlOperation(userBudgetQuery, parameters))
      .then(results => {
        this.getUserBudget()
      })
      .catch(err => {
        console.log("MJV ERROR => ", err)
      })
  }

  deleteUserBudget = () => {
    const userBudgetQuery = `mutation ($budgetId: ID!) {
      deleteUserBudget(input: {id: $budgetId}) {
        id
      }
    }`
    const { user, budget } = this.state

    budget.categories.forEach(category => {
      this.deleteCategory(category)
    })

    const parameters = { "budgetId": budget.id }
    API.graphql(graphqlOperation(userBudgetQuery, parameters))
      .then(results => {
        this.setState({ budget: null }, () => {
          this.getUserBudget()
        })
      })
      .catch(err => {

      })
  }

  createCategory() {
    const { newCategoryPrecent, newCategoryTitle, budget } = this.state
    if (isNaN(newCategoryPrecent)) {
      this.setState({ creatingCategoryError: "Percent must be a decimal" })
      return
    }
    if (Number.parseFloat(newCategoryPrecent) * 100 > this.calculateRemainingTotalBudget()) {
      this.setState({ creatingCategoryError: "Cannot exceed available remaining percent of " + this.calculateRemainingTotalBudget().toFixed(0) + "%" })
      return
    }
    if (newCategoryPrecent != "" && newCategoryTitle != "") {
      this.setState({ creatingCategory: true })      
      const createCategoryQuery = `mutation ($budgetId: String!, $title: String!, $precent: Float) {
        createBudgetCategory(input: {budgetID: $budgetId, title: $title, precent: $precent}) {
          id
          title
          precent
        }
      }`
      const parameters = { "budgetId": budget.id, "title": newCategoryTitle, "precent": Number.parseFloat(newCategoryPrecent) }
      API.graphql(graphqlOperation(createCategoryQuery, parameters))
        .then(results => {
          this.getUserBudget()
          this.setState({ creatingCategory: false, newCategoryTitle: "", newCategoryPrecent: "", creatingCategoryError: null })
        })
        .catch(err => {
          console.log(err)
        })
    }
  }

  createExpense() {
    const { newExpenseCategory, newExpensePrice, newExpenseDesc, budget } = this.state
    if (isNaN(newExpensePrice)) {
      this.setState({ creatingExpenseError: "Price must be a number" })
      return
    }
    if (newExpenseCategory && newExpensePrice != "" && newExpenseDesc != "") {
      this.setState({ creatingExpense: true })
      const createExpenseQuery = `mutation ($budgetId: String!, $userId: String! $categoryId: String!, $price: Float!, $title: String!) {
        createLineItem(input: {budgetID: $budgetId, userID: $userId, categoryID: $categoryId, price: $price, title: $title}) {
          id
          price
          categoryID
        }
      }`
      const parameters = { "budgetId": budget.id, "userId": budget.userID, "categoryId": newExpenseCategory, "price": Number.parseFloat(newExpensePrice), "title": newExpenseDesc }
      API.graphql(graphqlOperation(createExpenseQuery, parameters))
        .then(results => {
          this.getUserBudget()
          this.setState({ creatingExpense: false, newExpenseCategory: null, newExpensePrice: "", newExpenseDesc: "", creatingExpenseError: null })
        })
        .catch(err => {
          console.log(err)
        })
    }
  }

  deleteExpense = (id) => {
    // query to delete by id
    const deleteExpenseQuery = `
    mutation ($id: String!) {
      deleteLineItem(input: {id: $id}) {
        id
      }
    }
    `
    const parameters = { "id": id }
    API.graphql(graphqlOperation(deleteExpenseQuery, parameters))
      .then(results => {
        console.log(results)
        this.getUserBudget()
      })
      .catch(err => {
        console.log(err)
      })
  }

  deleteCategory = (category) => {
    // query to delete all the expenses
    // for loop
    // then delete the category
    category.lineItems.forEach(lineItem => {
      this.deleteExpense(lineItem.id)
    })
    const deleteCategoryQuery = `
    mutation ($id: String!) {
      deleteBudgetCategory(input: {id: $id}) {
        id
      }
    }
    `
    const parameters = { "id": category.id }
    API.graphql(graphqlOperation(deleteCategoryQuery, parameters))
      .then(results => {
        console.log(results)
        this.getUserBudget()
      })
      .catch(err => {
        console.log(err)
      })
  }
}

export default withAuthenticator(App, true);
