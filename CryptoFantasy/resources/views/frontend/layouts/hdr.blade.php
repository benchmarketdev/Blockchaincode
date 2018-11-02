@if ( $menu_data )
    @if ( count($menu_data) > 5 )
        @for( $i=0;$i<5;$i++ )
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                    {{ $menu_data[$i]['type_name'] }}
                    <span class="caret"></span>
                </a>
                <div class="dropdown-content">
                    <div class="menu-row">
                        @for($s=0;$s<3;$s++)
                            <div class="column">
                                <?php $step = ceil(count($menu_data[$i]['team_data'])/3); ?>
                                @for($d=($step*$s);$d<$step*($s+1);$d++)
                                    @if ( isset($menu_data[$i]['team_data'][$d]) )
                                        <a class="nav-a" href="/marketplace/{{ $menu_data[$i]['team_data'][$d]['_id'] }}">{{ $menu_data[$i]['team_data'][$d]['team_name'] }}</a>
                                    @endif
                                @endfor
                            </div>
                        @endfor
                    </div>
                </div>
            </li>
        @endfor
        <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown">More <b class="caret"></b></a>
            <div class="dropdown-menu">
            </div>
        </li>
    @else
        @for( $i=0;$i<count($menu_data);$i++ )
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                    {{ $menu_data[$i]['type_name'] }}
                    <span class="caret"></span>
                </a>
                @if ( count($menu_data[$i]['team_data']) > 3 )
                    <div class="dropdown-content">
                        <div class="menu-row">
                            @for($s=0;$s<3;$s++)
                                <div class="column">
                                    <?php $step = ceil(count($menu_data[$i]['team_data'])/3); ?>
                                    @for($d=($step*$s);$d<$step*($s+1);$d++)
                                        @if ( isset($menu_data[$i]['team_data'][$d]) )
                                            <a class="nav-a" href="/marketplace/{{ $menu_data[$i]['team_data'][$d]['_id'] }}">{{ $menu_data[$i]['team_data'][$d]['team_name'] }}</a>
                                        @endif
                                    @endfor
                                </div>
                            @endfor
                        </div>
                    </div>
                @else
                    <div class="dropdown-content" style="width:220px;">
                        <div class="menu-row">
                            <div class="column wide-lg">
                                @for($d=0;$d<count($menu_data[$i]['team_data']);$d++)
                                    @if ( isset($menu_data[$i]['team_data'][$d]) )
                                        <a class="nav-a" href="/marketplace/{{ $menu_data[$i]['team_data'][$d]['_id'] }}">{{ $menu_data[$i]['team_data'][$d]['team_name'] }}</a>
                                    @endif
                                @endfor
                            </div>
                        </div>
                    </div>
                @endif
            </li>
        @endfor
    @endif

@endif