import React, { Component } from 'react';
import axios from 'axios';
import matchSorter from 'match-sorter';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      enrollments: [],
      originalEnrollments: [],
      loadingEnrollments: true,
      youtubeId: '',
      submittingYoutubeId: false,
      searchString: '',
      personName: '',
    };
  }

  componentDidMount = () => {
    axios.get('http://localhost:8080/enrollments')
      .then((response) => {
        const { data: { enrollments } } = response;
        let enrollmentsArr = enrollments.split(";");
        this.setState({ enrollments: enrollmentsArr.slice(0, 20), originalEnrollments: enrollmentsArr, loadingEnrollments: false });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  }

  choosePerson = (event) => {
    this.setState({ personName: event.currentTarget.dataset.id})
  }

  notify = (msg) => toast(msg);

  createEmbedding = (event) => {
    event.preventDefault();
    this.setState({ submittingYoutubeId: true })
    const { youtubeId } = this.state;
    axios.post('http://localhost:8080/embeddings', { youtubeId })
      .then((response) => {
        if (response.data.includes('DONE')) {
          var url = new URL(youtubeId);
          var v = url.searchParams.get("v");
          this.notify('Created embedding ' + v);
          this.setState({ submittingYoutubeId: false });
        } else {
          this.notify('Something went wrong, try again...');
          this.setState({ submittingYoutubeId: false });
        }
      })
      .catch((error) => {
        console.log(error);
        this.notify('Serious error occurred...');
        this.setState({ submittingYoutubeId: false });
      });
  }

  search = (event) => {
    let enrollments = this.state.originalEnrollments;
    this.setState({ searchString: event.target.value },
      () => {
        enrollments = matchSorter(enrollments, this.state.searchString);
        this.setState({ enrollments: enrollments.slice(0, 20) });
      }
    );
  }

  render() {
    const { loadingEnrollments, enrollments, youtubeId, searchString, submittingYoutubeId, personName } = this.state;

    return (
      <main>
        <ToastContainer
          position="top-right"
          autoClose={false}
          newestOnTop={false}
        />
        <section className="youtubeInput">
          <h1>Create Embedding</h1>
          <form onSubmit={this.createEmbedding}>
            <label>
              Youtube ID: <input type="text" name="youtubeId" value={youtubeId} onChange={this.handleChange} />
            </label>
            {submittingYoutubeId ? (
              <input type="submit" value="Computing ..." />
            ) : (
              <input type="submit" value="Submit" />
            )}
          </form>
        </section>

        <section className="enrollments-list" style={{ minHeight: '443px'}}>
          <h1>Enrolled Speakers { !loadingEnrollments && `(${this.state.originalEnrollments.length})`}</h1>
          { loadingEnrollments && <div id="loader"></div>}
          <input type="text" value={searchString} placeholder="Search..." onChange={this.search} />
          {enrollments.length > 0 &&
            <ul>
              {enrollments.map((enrollment, idx) => (
                <li key={idx} onClick={this.choosePerson.bind(this)} data-id={enrollment}>{enrollment}</li>
              ))}
            </ul>
          }
        </section>

        <section>
          <h1>Actions</h1>
          <input type="text" value={personName} name="personName" placeholder="Name" onChange={this.handleChange} />
        </section>

      </main>
    );
  }
}

export default App;
