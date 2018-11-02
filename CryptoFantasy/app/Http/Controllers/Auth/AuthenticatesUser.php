<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Auth\RedirectsUsers;
use Illuminate\Foundation\Auth\ThrottlesLogins;

trait AuthenticatesUser
{
    use RedirectsUsers, ThrottlesLogins;

    /**
     * Show the application's login form.
     *
     * @return \Illuminate\Http\Response
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Handle a login request to the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $useremail = $request->input('email');
        $password = $request->input('password');
        $remember = $request->input('remember');
        // Check if user is using email or username
        $field = filter_var($useremail, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $credentials = [
            $field => $useremail,
            'password' => $password,
        ];
        // check if user is authentic
        if (auth()->attempt($credentials, $remember)) {
            // check if email has been verified
            if (!auth()->user()) {
                auth()->logout();
                session()->flash('error', 'You must verify your email before you can access the site. ' .
                    '<br>If you have not received the confirmation email check your spam folder. ' .
                    '<b><a class="alert-link" href="' . route('resend.email') . '" class="alert-link">Click here</a></b> for the option to resend.');
                return redirect()->route('home');
            }
            //event(new UserHasLoggedIn(auth()->user()));
            session()->flash('success', 'Successfully logged in!');
            if (auth()->user()->user_role == 1)
                return redirect()->intended(route('adminpanel'));
            return redirect()->intended(route('dashboard'));
        }
        session()->flash('error', 'Your [Username/Email] and/or Password is incorrect!');
        return redirect()->back()->withInput();

//        $this->validateLogin($request);

//        // If the class is using the ThrottlesLogins trait, we can automatically throttle
//        // the login attempts for this application. We'll key this by the username and
//        // the IP address of the client making these requests into this application.
//        if ($this->hasTooManyLoginAttempts($request)) {
//            $this->fireLockoutEvent($request);
//
//            return $this->sendLockoutResponse($request);
//        }
//
//        if ($this->attemptLogin($request)) {
//            return $this->sendLoginResponse($request);
//        }
//
//        // If the login attempt was unsuccessful we will increment the number of attempts
//        // to login and redirect the user back to the login form. Of course, when this
//        // user surpasses their maximum number of attempts they will get locked out.
//        $this->incrementLoginAttempts($request);
//
//        return $this->sendFailedLoginResponse($request);
    }

    /**
     * Validate the user login request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return void
     */
    protected function validateLogin(Request $request)
    {
        $useremail = $request->input('email');
        $password = $request->input('password');
        $field = filter_var($useremail, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $this->validate($request, [
            $field => 'required|string',
            'password' => 'required|string',
        ]);
    }

    /**
     * Attempt to log the user into the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function attemptLogin(Request $request)
    {
        return $this->guard()->attempt(
            $this->credentials($request), $request->filled('remember')
        );
    }

    /**
     * Get the needed authorization credentials from the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    protected function credentials(Request $request)
    {
        $useremail = $request->input('email');
        $password = $request->input('password');
        $field = filter_var($useremail, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        return $request->only($field, 'password');
//        return $request->only($this->username(), 'password');
    }

    /**
     * Send the response after the user was authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    protected function sendLoginResponse(Request $request)
    {
        $request->session()->regenerate();

        $this->clearLoginAttempts($request);

        $loggedUser = $this->guard()->user();
        if ( $loggedUser->user_role == 1 ) {
            return redirect()->route('adminpanel');
        }
        else {
            return redirect()->route('dashboard');
        }
        return $this->authenticated($request, $this->guard()->user())
            ?: redirect()->intended($this->redirectPath());
    }

    /**
     * The user has been authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $user
     * @return mixed
     */
    protected function authenticated(Request $request, $user)
    {
        //
    }

    /**
     * Get the failed login response instance.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws ValidationException
     */
    protected function sendFailedLoginResponse(Request $request)
    {
        throw ValidationException::withMessages([
            $this->username() => [trans('auth.failed')],
        ]);
    }

    /**
     * Get the login username to be used by the controller.
     *
     * @return string
     */
    public function username()
    {
        return 'email';
    }

    /**
     * Log the user out of the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function logout(Request $request)
    {
        $this->guard()->logout();

        $request->session()->invalidate();

        return redirect('/');
    }

    /**
     * Get the guard to be used during authentication.
     *
     * @return \Illuminate\Contracts\Auth\StatefulGuard
     */
    protected function guard()
    {
        return Auth::guard();
    }
}
