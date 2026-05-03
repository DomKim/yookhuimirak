<?php
$sql = " select * from g5_layout_css_set where name = 'mainpage' ";
$result = sql_fetch($sql);

$sql1 = " select * from g5_content_block_set where name = 'mainpage' ";
$result1 = sql_fetch($sql1);

$container_width = $result['css_1'];

$position_Arr = explode('|',$result1['sidebar_position']);
$position_left = $position_Arr[1];
$position_right = $position_Arr[2];
//$position_right = $position_Arr[1];
//$position_right = $position_Arr[1];

if($position_left=='left'){
  $calc_width = 'calc(100% - '.$result['css_4'].')';
} else if($position_right=='right'){
  $calc_width = 'calc(100% - '.$result['css_5'].')';
}else {
  $calc_width = '100%';
}
?>
<style>
body { overflow:hidden; }
.container { width:<?=$container_width?>; margin:0 auto; }

.container_content { width: <?=$calc_width?>; float: left;}

#footer {clear: both;}

<?php if($position3){?>
#b_left { width : <?=$result['css_2']?>; float: left; }
<?php }?>
<?php if($position4){?>
#b_right { width : <?=$result['css_3']?>; float: right; }
<?php }?>
<?php if($position1){?>
#left { width : <?=$result['css_4']?>; float: left; }
<?php }?>
<?php if($position2){?>
#right { width : <?=$result['css_5']?>; float: right; }
<?php }?>
#page_wrap { width : <?=$result['css_6']?>; float: left; }
#content_wrap { width : <?=$result['css_7']?>; float: left; overflow: hidden;}


@media (max-width:<?=$result['css_8']?>px) {
  .container {width: 100%;}
  .container_content { width: <?=$calc_width?>; float: left;}

  <?php if($position3){?>
  #b_left { width : <?=$result['css_2']?>; float: left; }
  <?php }?>
  <?php if($position4){?>
  #b_right { width : <?=$result['css_3']?>; float: right; }
  <?php }?>
  <?php if($position1){?>
  #left { width : <?=$result['css_4']?>; float: left; }
  <?php }?>
  <?php if($position2){?>
  #right { width : <?=$result['css_5']?>; float: right; }
  <?php }?>
  #page_wrap { width : <?=$result['css_6']?>; float: left; }
  #content_wrap { width : 100%; float: left; }
}


@media (max-width:<?=$result['css_9']?>px) {
  .container {width: 100%;}
  .container_content { width: 100%; float: left;}

  <?php if($position3){?>
  #b_left { width : 100%; float: left; }
  <?php }?>
  <?php if($position4){?>
  #b_right { width : 100%; float: right; }
  <?php }?>
  <?php if($position1){?>
  #left { width : 100%; float: left; }
  <?php }?>
  <?php if($position2){?>
  #right { width : 100%; float: right; }
  <?php }?>
  #page_wrap { width : 100%; float: left; }
  #content_wrap { width : 100%; float: left; }
}

</style>
