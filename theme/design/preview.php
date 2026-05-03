<?php
include_once('_common.php');

/*if ($is_admin != 'super')
    alert('최고관리자만 접근 가능합니다.');
*/
// 블럭값
$blcok_name = $_GET['name'];
$g5['title'] = $blcok_name.'미리보기';
include_once(G5_THEME_PATH.'/head.sub.php');
include_once(G5_LIB_PATH.'/latest.lib.php');

echo '<script src="'.G5_ADMIN_URL.'/design_admin/js/html2canvas.js"></script>';

// 기본 레이아웃 스타일
include_once(G5_THEME_PATH.'/basic_css.php');
echo '<div id="viewCapture">';
include_once(G5_THEME_PATH.'/template/'.$blcok_name.'/index.html');
echo '</div>';
include_once(G5_THEME_PATH.'/tail.sub.php');
?>
<style>
#screenCapture {
  margin:50px 0px; background: #383838; color:#fff; padding:10px 30px; border:0px;
}
#delCapture {
  margin:50px 0px; background: #383838; color:#fff; padding:10px 30px; border:0px;
}
</style>
<!-- 썸네일 생성 -->
<div style="clear:both;">
<center>
  <button id="screenCapture">썸네일 생성</button>
  <button id="delCapture">썸네일 삭제</button>
</center>
</div>

<!-- 하단 스크립트 -->
<?php
$sql1 = " select * from g5_block_setup where setup_2 = 'js' and setup_1 = 'y' ";
$result1 = sql_query($sql1);

for ($i12=0; $row1=sql_fetch_array($result1); $i12++) {
?>
<script type="text/javascript" src="<?=G5_THEME_URL.'/js/'.$row1['name']?>.js"></script>
<?php
}
?>

<script>
// 썸네일 생성
$('#screenCapture').on('click',function(){
  html2canvas(document.querySelector("#viewCapture")).then(canvas => {
      //document.body.appendChild(canvas)
      var img_data = canvas.toDataURL();
      var name = '<?=$blcok_name?>';
      var mode = 'write';

      // ajax data send
      $.ajax({
          url: "<?=G5_ADMIN_URL?>/design_admin/creatCapture.php",
          type: "POST",
          data:{
            'mode':mode,
            'name':name,
            'hidden_data':img_data
      		},
          dataType: 'text',
          success: function(result){
            alert("썸네일이 생성되었습니다.");
          }
      });

  });
});

// 썸네일 삭제
$('#delCapture').on('click',function(){

  var name = '<?=$blcok_name?>';
  var mode = 'del';

  $.ajax({
      url: "<?=G5_ADMIN_URL?>/design_admin/creatCapture.php",
      type: "POST",
      data:{
        'mode':mode,
        'name':name
      },
      dataType: 'text',
      success: function(result){
        alert("썸네일이 삭제되었습니다.");
      }
  });

});
</script>
