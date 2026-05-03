<?php
$position_arr = explode('|',$sidebar_position);
for ($i=1; $i < count($position_arr); $i++) {
  $position1 = $position_arr[1];
  $position2 = $position_arr[2];
  $position3 = $position_arr[3];
  $position4 = $position_arr[4];
}


if(!($position4)){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 80%; }
.content_wrap2 {
	float: left; width: 60%;
}
</style>
<?php }

if(!$position3){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 80%; }
.content_wrap2 {
	float: left; width: 60%;
}
</style>
<?php }

if(!$position2){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 100%; }
.content_wrap2 {
	float: left; width: 80%;
}
</style>
<?php }

if(!$position1){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 100%; }
.content_wrap2 {
	float: left; width: 80%;
}
</style>
<?php }


if($position3){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 80%; }
.content_wrap2 {
	float: left; width: 80%;
}
</style>
<?php }


if($position4){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 80%; }
.content_wrap2 {
	float: left; width: 80%;
}
</style>
<?php }


if($position3 && $position4){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 60%; }
.content_wrap2 {
	float: left; width: 80%;
}
</style>
<?php }


if($position1&&$position2&&$position3){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 80%; }
.content_wrap2 {
	float: left; width: 60%;
}
</style>
<?php }


if($position1&&$position2&&$position4){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap { float: left; width: 80%; }
.content_wrap2 {
	float: left; width: 60%;
}
</style>
<?php }


if($position1&&$position2&&$position3&&$position4){
?>
<style>
.b_side_left, .b_side_right {
	float: left; width: 20%; padding:5px;
}
.side_left, .side_right {
	float: left; width: 20%; padding:5px;
}
.content_wrap, .content_wrap2 {
	float: left; width: 60%;
}
</style>
<?php }

?>
