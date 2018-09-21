import React, { Component } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      enrollments: [],
      doRender: false,
    };
  }

  componentDidMount = () => {
    axios.get('http://localhost:8080/enrollments')
      .then((response) => {
        const { data: { enrollments } } = response;
        let enrollmentsArr = enrollments.split(";");
        this.setState({ doRender: true, enrollments: enrollmentsArr });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    const { doRender, enrollments } = this.state;
    if (!doRender) {
      return (<div>Loading...</div>);
    }
    return (
      <section>
        <ul>
          {enrollments.length > 0 &&
            enrollments.map((enrollment) => (<li>{enrollment}</li>))
          }
        </ul>
      </section>
    );
  }
}

export default App;
