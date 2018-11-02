@extends('backend.layouts.manager')

@section('content')
    <table id="example" class="display" cellspacing="0" width="100%">
        <thead>
        <tr>
            <th>User Name</th>
            <th>User Email</th>
            <th>Created Date</th>
        </tr>
        </thead>
        <tbody>
            @if ( $user_list )
                @foreach( $user_list as $user )
                    <tr id="{{ $user['_id'] }}">
                        <td>{{ $user['username'] }}</td>
                        <td>{{ $user['email'] }}</td>
                        <td>{{ date('Y-m-d H:i:s', strtotime($user['created_at'])) }}</td>
                    </tr>
                @endforeach
            @endif
        </tbody>
    </table>
<script>
    $(document).ready(function() {
        var table = $('#example').DataTable();
        $('#example tbody').on( 'click', 'tr', function () {
            if ( $(this).hasClass('selected') ) {
                $(this).removeClass('selected');
            }
            else {
                table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
            }
            alert($(this)[0].id);
        } );

    } );
</script>
@endsection