@extends('frontend.layouts.header')

@section('content')
<style>
    @media (min-width:768px) {
        .top125 {
            margin-top: 125px;
        }
    }
    .panel, .panel-heading {
        background: #ffffff4a!important;
    }
    input.form-control {
        background: rgba(0,0,0,0.2)!important;
        color: black!important;
    }
    .control-label {
        color: black;
    }

</style>
<div class="container">
    <form method="POST" id="user_register_form" class="auth-login" action="{{ route('register') }}">
        {{ csrf_field() }}
        <input type="hidden" name="address" value="" />
        <input type="hidden" name="privatekey" value="" />
        <div class="form-group-lg auth-title" >
            {{--<label class="label-auth-top-title">Please fill out the information below first</label>--}}
            <label class="label-auth-sub-title">All you need to start is an account. <br/>Get one for free now!</label>
        </div>
        <div class="group">
            <input type="text" class="auth-input" name="username"><span class="highlight"></span><span class="bar"></span>
            <label class="auth-label">Username*</label>
            @if ($errors->has('username'))
                <span class="invalid-feedback">
                    <strong>{{ $errors->first('username') }}</strong>
                </span>
            @endif
        </div>
        <div class="group">
            <input type="email" class="auth-input" name="email"><span class="highlight"></span><span class="bar"></span>
            <label class="auth-label">Email*</label>
            @if ($errors->has('email'))
                <span class="invalid-feedback">
                            <strong>{{ $errors->first('email') }}</strong>
                        </span>
            @endif
        </div>
        <div class="group">
            <input type="password" class="auth-input" name="password"><span class="highlight"></span><span class="bar"></span>
            <label class="auth-label">Password*</label>
            @if ($errors->has('password'))
                <span class="invalid-feedback">
                            <strong>{{ $errors->first('password') }}</strong>
                        </span>
            @endif
        </div>
        <div class="group">
            <input type="password" class="auth-input" name="password_confirmation" required><span class="highlight"></span><span class="bar"></span>
            <label class="auth-label">Confirm Password*</label>
            @if ($errors->has('password'))
                <span class="invalid-feedback">
                            <strong>{{ $errors->first('password') }}</strong>
                        </span>
            @endif
        </div>
        <div class="group text-center">
            <button type="button" id="register" class="button buttonBlue">REGISTER
                <div class="ripples buttonRipples"><span class="ripplesCircle"></span></div>
            </button>
        </div>
    </form>
</div>
<script src="{{ asset('./js/frontend/register.js') }}"></script>
@endsection
