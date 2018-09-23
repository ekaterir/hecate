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
      verifyingInProgress: false,
      enrollingInProgress: false,
    };
  }

  componentDidMount = () => {
    this.getEnrollments();
  }

  getEnrollments = () => {
    axios.get('http://localhost:8080/enrollments')
      .then((response) => {
        const { data: { enrollments } } = response;
        let enrollmentsArr = enrollments.split(";");
        this.setState({ enrollments: enrollmentsArr.slice(0, 100), originalEnrollments: enrollmentsArr, loadingEnrollments: false });
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

  notify = (msg, type = '') => {
    switch (type) {
      case 'ACCEPT':
        toast.success(msg, { className: 'larger-font-size' });
        break;
      case 'REJECT':
        toast.error(msg, { className: 'larger-font-size' });
        break;
      default:
        toast(msg, { className: 'black-text-color larger-font-size' })
      }
  };

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

  verify = (event) => {
    event.preventDefault();
    const { personName } = this.state;
    this.setState({ verifyingInProgress: true });
    axios.get('http://localhost:8080/verify?personName=' + personName)
      .then((response) => {
        if (response.data.includes('ACCEPT')) {
          this.notify('Accepted ' + personName, 'ACCEPT');
        } else if (response.data.includes('REJECT')) {
          this.notify('Rejected ' + personName, 'REJECT');
        }
        this.setState({ verifyingInProgress: false });
      })
      .catch((error) => {
        console.log(error);
        this.setState({ verifyingInProgress: false });
      });
  }

  enroll = (event) => {
    event.preventDefault();
    const { personName } = this.state;
    this.setState({ enrollingInProgress: true });
    axios.post('http://localhost:8080/enroll', { personName })
      .then((response) => {
        if (response.data.includes('DONE')) {
          this.getEnrollments();
          this.notify('Enrolled ' + personName);
        } else {
          this.notify('Something went wrong, try again...');
        }
        this.setState({ enrollingInProgress: false });
      })
      .catch((error) => {
        console.log(error);
        this.notify('Serious error occurred...');
        this.setState({ enrollingInProgress: false });
      });
  }

  voiceSearch = (event) => {
    event.preventDefault();
    this.setState({ loadingEnrollments: true, enrollments: [] });
    axios.get('http://localhost:8080/voice-search')
      .then((response) => {
        const { data: { enrollments } } = response;
        let enrollmentsArr = enrollments.split(";");
        this.setState({ enrollments: enrollmentsArr.slice(0, 100), loadingEnrollments: false });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  search = (event) => {
    let enrollments = this.state.originalEnrollments;
    this.setState({ searchString: event.target.value },
      () => {
        enrollments = matchSorter(enrollments, this.state.searchString);
        this.setState({ enrollments: enrollments.slice(0, 100) });
      }
    );
  }

  render() {
    const { loadingEnrollments, enrollments, youtubeId, searchString, submittingYoutubeId, personName, verifyingInProgress, enrollingInProgress } = this.state;

    return (
      <main className="container-fluid mt-5 mb-5">
        <ToastContainer
          position="top-right"
          autoClose={false}
          newestOnTop={false}
        />

        <div className="row">
          <div className="col-4">
            <section className="col mb-5 create-embedding rounded">
              <div className="pt-3"></div>
              <h4>Create Embedding</h4>
              <form className="form-group" onSubmit={this.createEmbedding}>
                <input placeholder="Youtube ID" className="form-control" type="text" name="youtubeId" value={youtubeId} onChange={this.handleChange} />
                <div className="pt-3"></div>
                {submittingYoutubeId ? (
                  <input className="btn btn-light" type="submit" value="Creating..." />
                ) : (
                  <input className="btn btn-light" type="submit" value="Create" />
                )}
              </form>
            </section>
            <section className="col actions rounded">
              <div className="pt-3"></div>
              <h4>Actions</h4>
              <form className="form-group">
                <input className="form-control" type="text" value={personName} name="personName" placeholder="Name" onChange={this.handleChange} />
                <div className="pt-3"></div>
                <input className="btn btn-light" type="button" value={verifyingInProgress ? "Verifying..." : "Verify"} onClick={this.verify} />
                <span className="pr-3"></span>
                <input className="btn btn-light" type="button" value={enrollingInProgress ? "Enrolling..." : "Enroll"} onClick={this.enroll}/>
              </form>
            </section>
          </div>
          <section className="col-4 enrollments-list rounded">
            <div className="pt-3"></div>
            <h4>Enrolled Speakers { !loadingEnrollments && `(${this.state.originalEnrollments.length})`}</h4>
            <p>Sort:
              <span className="pr-3"></span>
              <input className="btn btn-light" type="button" value="Alphabetically" onClick={this.getEnrollments}/>
              <span className="pr-3"></span>
              <input className="btn btn-light" type="button" value="Similarity" onClick={this.voiceSearch}/>
            </p>
            <form className="form-group">
              <input className="form-control" type="text" value={searchString} placeholder="Search..." onChange={this.search} />
            </form>
            { loadingEnrollments && <p>Loading ...</p>}
            {enrollments.length > 0 &&
              <ul className="list-group list-group-flush">
                {enrollments.map((enrollment, idx) => (
                  <li className="list-group-item cursor-pointer" key={idx} onClick={this.choosePerson.bind(this)} data-id={enrollment}>{enrollment}</li>
                ))}
              </ul>
            }
          </section>
        </div>

      </main>
    );
  }
}

export default App;
