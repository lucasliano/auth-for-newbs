<template>
  <section>
    <h1>Signup</h1>
    <div v-if="signingUp">
      <img src="../assets/pacman_loading.svg" />
    </div>
    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>
    <form v-if="!signingUp" @submit.prevent="signup">   <!-- @subit.prevent executes the script at the bottom-->
      <div class="form-group">
        <h4 for="username">Username</h4>
        <input
          v-model="user.username"
          type="text"
          class="form-control"
          id="username"
          aria-describedby="usernameHelp"
          placeholder="Enter a username" required>
        <p id="usernameHelp" class="form-text text-muted">
         Username must be longer than 2 characters and shorter than 30.
         Username can only contain alphanumeric characters and under_scores.
        </p>
      </div>
      <div class="form-row">
        <div class="form-group col-md-6">
          <h4 for="password">Password</h4>
          <input
            v-model="user.password"
            type="password"
            class="form-control"
            id="password"
            aria-describedby="passwordHelp"
            placeholder="Password" required>
          <p id="passwordHelp" class="form-text text-muted">
          Password must be 10 or more characters long.
          </p>
        </div>
        <div class="form-group col-md-6">
          <h4 for="confirmPassword">Confirm Password</h4>
          <input
            v-model="user.confirmPassword"
            type="password"
            class="form-control"
            id="confirmPassword"
            aria-describedby="confirmPasswordHelp"
            placeholder="Password" required>
          <p id="confirmPasswordHelp" class="form-text text-muted">
          Please confirm your password.
          </p>
        </div>
      </div>
      <button type="submit" class="btn btn-primary">Signup</button>
    </form>
  </section>
</template>

<script>
import Joi from 'joi';

const SIGNUP_URL = 'http://localhost:5000/auth/signup';

const schema = Joi.object().keys({
  username: Joi.string().regex(/(^[a-zA-Z0-9_]+$)/).min(2).max(30)
    .required(),
  password: Joi.string().trim().min(8).required(),
  confirmPassword: Joi.string().trim().min(8).required(),
});

export default {
  data: () => ({      // We access this structure using v-model="user.username"
    signingUp: false,
    errorMessage: '',
    user: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  }),
  watch: {
    user: {
      handler() {
        this.errorMessage = '';
      },
      deep: true,
    },
  },
  methods: {
    signup() {
      this.errorMessage = '';
      if (this.validUser()) {
        const body = {
          username: this.user.username,
          password: this.user.password,
        };
        this.signingUp = true;
        fetch(SIGNUP_URL, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'content-type': 'application/json',
          },
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return response.json().then((error) => {
            throw new Error(error.message);
          });
        }).then((result) => {
          localStorage.token = result.token;
          setTimeout(() => {
            this.signingUp = false;
            this.$router.push('/dashboard');
          }, 1000);
        }).catch((error) => {
          setTimeout(() => {
            this.signingUp = false;
            this.errorMessage = error.message;
          }, 1000);
        });
      }
    },
    validUser() {
      if (this.user.password !== this.user.confirmPassword) {
        this.errorMessage = 'Passwords must match. 🙈';
        return false;
      }

      const result = Joi.validate(this.user, schema);
      if (result.error === null) {
        return true;
      }

      if (result.error.message.includes('username')) {
        this.errorMessage = 'Username is invalid. 😭';
      } else {
        this.errorMessage = 'Password is invalid. 🙈';
      }

      return false;
    },
  },
};
</script>

<style>

</style>
