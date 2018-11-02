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
    {{--body {--}}
        {{--background: url( {{ asset('./images/background/login-bg.png') }} );--}}
        {{--font-family: monospace, sans-serif;--}}
        {{--background-size: cover;--}}
    {{--}--}}
</style>
<div class="container">
    <form class="auth-login" method="POST" action="{{ route('login') }}">
        {{ csrf_field() }}
        <div class="form-group-lg auth-title" >
            {{--<label class="label-auth-top-title">One account is all you need</label>--}}
            <label class="label-auth-sub-title">Please enter your details below.</label>
        </div>
        <div class="group">
            <input type="text" class="auth-input" name="email"><span class="highlight"></span><span class="bar"></span>
            <label class="auth-label">Email or Username*</label>
            @if ($errors->has('email'))
                <span class="invalid-feedback">
            <strong>{{ $errors->first('email') }}</strong>
        </span>
            @endif
        </div>
        <div class="group">
            <input type="password" class="auth-input" name="password"><span class="highlight"></span><span class="bar"></span>
            <label class="auth-label">Password*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
            @if ($errors->has('password'))
                <span class="invalid-feedback">
            <strong>{{ $errors->first('password') }}</strong>
        </span>
            @endif
        </div>
        <div class="group text-center">
            <button type="submit" class="button buttonBlue">LOGIN
                <div class="ripples buttonRipples"><span class="ripplesCircle"></span></div>
            </button>
            <div class="div-auth-button-wrap">
                <label class="label-auth-bottom-title">New to CryptoFantasy?</label>
                <a href="{{ route('register') }}" class="nav-link a-join-here">JOIN HERE</a>
            </div>
        </div>
    </form>
</div>
<script>
    $('input.auth-input').blur(function() {
        var $this = $(this);
        if ($this.val())
            $this.addClass('used');
        else
            $this.removeClass('used');
    });
</script>
@endsection
