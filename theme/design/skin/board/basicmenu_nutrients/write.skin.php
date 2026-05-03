
<style>

    /*게시판 커스텀 공통*/
        .quickAgree a {
        font-size: 1.2rem;
    }

    .quick_ri_2 input {
        font-size: 1.2rem;
    }
    .quick_submit {
        font-size: 1.4rem;
    }

    header {
        font-size: calc(1rem + ((1vw - 0.48rem) * 1.3889));
    }

    body {
        font-size: 1em;
    }

    .cmt_btn {
        font-family: "pretendard";
    }

    .board_title {
        display: none;
    }

    .margin-default {
        margin: 50px 0 100px;
    }

    .margin-default>p {
        display: none;
    }

    .sv_member {
        display: none;
    }

    .gall_info {
        display: none;
    }

    #bo_sch {
        display: none;
    }

    .gall_text_href {
        padding-top: 5%;
    }

    #gall_ul li {
        border: 1px solid #2c5e39;
        box-shadow: 0px 2px 10px 0px #1111112e;
    }

    /*게시판 커스텀 끝*/
    .k_new_btn_con{
        margin-top: 5%;
        margin-bottom: 5%;
    }
    .k_btn_inner {
        font-size: 1vw;
        background: black;
        color: white;
        padding: 1% 3%;
        border-radius: 30px;
        width: 5vw;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .k_btn_inner > input {
        outline: none;
        appearance: none;
        border: unset;
        background: unset;
        color: white;
        font-size: 1vw;
    }
    .k_new_btn >.k_btn_inner:nth-child(2) {
        background: #0000008f;
        margin-left: 2%;
        padding: 1% 3% !important;
    }
    .k_input_sort{
        width: 18vw;
        height: 2.6vw;
        box-sizing: border-box;        
    }
    #k_w_bo{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }
.td_sort {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 0;
    font-family: 'Pretendard-regular';
    background: #eee;
    height: 2.6vw;
    color: #505050ba;
    width: 11vw;
}
    .tr_sort{
        
    }
    .k_w_bo_1st{
        margin-top: 6%;
    }
    @media screen and (max-width: 599px){
        .k_input_sort{
            width: 38vw;
        } 
        .k_btn_inner {
            font-size: 5vw;
            background: black;
            color: white;
            padding: 1% 3%;
            border-radius: 30px;
            width: 23vw;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .k_btn_inner > input {
            outline: none;
            appearance: none;
            border: unset;
            background: unset;
            color: white;
            font-size: 5vw;
        }        
        .td_sort {
            display: flex;
            font-family: 'Pretendard-regular';
            width: 27vw;
            height: 9.6vw;
        }
        .k_input_sort {
            width: 63vw;
            height: 9.6vw;

        }        
    }
</style>


<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);
?>
<div class="margin-default">
<h3 class="board_title"><?php echo $board['bo_subject'] ?></h3>
<p><?=$config['cf_title']?>의 <?php echo $board['bo_subject'] ?>입니다.</p>

<section id="bo_w">
    <h2 class="sound_only"><?php echo $g5['title'] ?></h2>

    <!-- 게시물 작성/수정 시작 { -->
    <form name="fwrite" id="fwrite" action="<?php echo $action_url ?>" onsubmit="return fwrite_submit(this);" method="post" enctype="multipart/form-data" autocomplete="off" style="width:<?php echo $width; ?>">
    <input type="hidden" name="uid" value="<?php echo get_uniqid(); ?>">
    <input type="hidden" name="w" value="<?php echo $w ?>">
    <input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
    <input type="hidden" name="wr_id" value="<?php echo $wr_id ?>">
    <input type="hidden" name="sca" value="<?php echo $sca ?>">
    <input type="hidden" name="sfl" value="<?php echo $sfl ?>">
    <input type="hidden" name="stx" value="<?php echo $stx ?>">
    <input type="hidden" name="spt" value="<?php echo $spt ?>">
    <input type="hidden" name="sst" value="<?php echo $sst ?>">
    <input type="hidden" name="sod" value="<?php echo $sod ?>">
    <input type="hidden" name="page" value="<?php echo $page ?>">



        
    <div class="bo_w_select write_div" id='depth2_cate'>
        <label for="wr_3"  class="sound_only">분류<strong>필수</strong></label>
        <select name="wr_3" id="wr_3" style='display:none;'>
            <option value="">하위 분류를 선택하세요</option>
            <option id="1" value="토마토">토마토</option>
            <option id="2" value="크림">크림</option>
            <option id="3" value="오일">오일</option>
            <option id="4" value="로제">로제</option>
        </select>

    </div>

    <div class="bo_w_info write_div">
    <?php if ($is_name) { ?>
        <label for="wr_name" class="sound_only">이름<strong>필수</strong></label>
        <input type="text" name="wr_name" value="<?php echo $name ?>" id="wr_name" required class="frm_input required" placeholder="이름">
    <?php } ?>

    <?php if ($is_password) { ?>
        <label for="wr_password" class="sound_only">비밀번호<strong>필수</strong></label>
        <input type="password" name="wr_password" id="wr_password" <?php echo $password_required ?> class="frm_input <?php echo $password_required ?>" placeholder="비밀번호">
    <?php } ?>

    <?php if ($is_email) { ?>
            <label for="wr_email" class="sound_only">이메일</label>
            <input type="text" name="wr_email" value="<?php echo $email ?>" id="wr_email" class="frm_input email " placeholder="이메일">
    <?php } ?>
    </div>

    <?php if ($is_homepage) { ?>
    <div class="write_div">
        <label for="wr_homepage" class="sound_only">홈페이지</label>
        <input type="text" name="wr_homepage" value="<?php echo $homepage ?>" id="wr_homepage" class="frm_input full_input" size="50" placeholder="홈페이지">
    </div>
    <?php } ?>

    <?php if ($option) { ?>
    <div class="write_div">
        <span class="sound_only">옵션</span>
        <?php echo $option ?>
    </div>
    <?php } ?>
				<div id="k_w_bo" class="k_w_bo_1st">
					<table class="k_w_table">
						<!---<?php if ($option) { ?>
						<tr class="option-box">
							<td width=200>공지 <span class="sound_only">공지</span></td>
							<td>
								<?php echo $option ?>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 출력순서와 상관없이 맨위로 고정시킵니다.</span>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 전체 탭에서만 적용됩니다.</span>
							</td>
						</tr>
						<?php } ?>--->

						<!---<tr class="option-box">
							<td width=200>메인출력</td>
							<td>
								<input type="checkbox" name="wr_2" value="1" id="wr_2" <?php echo get_checked($write['wr_2'], '1'); ?>> 체크하시면 메인페이지에 출력됩니다.
							</td>
						</tr>--->

						<tr class="option-box tr_sort">
							<td class='td_sort' width=200>출력순서</td>
							<td>
								<input type="text" name="wr_1" value="<?php echo $wr_1 ?>" id="wr_1" class="frm_input k_input k_input_sort" maxlength="3" placeholder="ex) 1 ~ 999" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');">
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 999 ~ 1 사이의 숫자를 입력해주세요.</span>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 숫자가 높을수록 먼저 출력됩니다.</span>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 숫자가 같을 경우 최신순으로 출력됩니다.</span>
							</td>
						</tr>
					</table>
				</div>
        
				<div id="k_w_bo" style="margin-top: 50px;">
					<table class="k_w_table">
						<tr class="option-box tr_sort">
							<td class='td_sort' width=200>분류<b>*</b><span class="sound_only">필수</span></td>
							<td >
								<select name="ca_name" id="ca_name" class="frm_input k_input k_input_sort required" style="font-size: 1rem;">
									<option value="">분류를 선택하세요</option>
									<?php echo $category_option ?>
								</select>
							</td>
						</tr>

			            <tr class="option-box tr_sort dessert_2nd_depth">
							<td class='td_sort' width=200>디저트 하위분류<b>*</b><span class="sound_only">필수</span></td>
							<td >
                                <select name="wr_4" id="wr_4" class="frm_input k_input k_input_sort" style="font-size: 1rem;">
                                    <option value="">하위분류를 선택하세요</option>
                                    <option id="1" value="오믈렛">오믈렛</option>
                                    <option id="2" value="스콘">스콘</option>
                                    <option id="3" value="아메리칸쿠키">아메리칸쿠키</option>
                                    <option id="4" value="크로플">크로플</option>
                                    <option id="5" value="소금빵">소금빵</option>
                                    <option id="6" value="크루아상">크루아상</option>
                                    <option id="7" value="차차베이커리">차차베이커리</option>

                                </select>
							</td>
						</tr>   



			            <tr class="option-box tr_sort cfbv_2nd_depth">
							<td class='td_sort' width=200>커피 하위분류<b>*</b><span class="sound_only">필수</span></td>
							<td >
                                <select name="wr_5" id="wr_5" class="frm_input k_input k_input_sort" style="font-size: 1rem;">
                                    <option value="">하위분류를 선택하세요</option>
                                    <option id="1" value="커피">커피</option>
                                    <option id="2" value="라떼">라떼</option>
                                    <option id="3" value="콜드브루">콜드브루</option>
                                    <!--<option id="4" value="라떼(논커피)">베버리지</option>-->
                                    <option id="4" value="베버리지">베버리지</option>
                                    <option id="5" value="쉐이크">쉐이크</option>
                                    <option id="6" value="스무디">스무디</option>
                                    <!--<option id="7" value="밀크티">밀크티</option>-->
                                    <option id="8" value="에이드">에이드</option>
                                    <option id="9" value="티">티</option>

                                </select>
							</td>
						</tr>    

                        
                        
			            <tr class="option-box tr_sort">
							<td class='td_sort' width=200>신메뉴 선택<b>*</b><span class="sound_only">필수</span></td>
							<td >
                                <select name="wr_link1" id="wr_link1" class="frm_input k_input k_input_sort" style="font-size: 1rem;">
                                    <option value="">신메뉴를 선택하세요</option>
                                    <option id="1" value="신메뉴">신메뉴</option>
                                    <option id="2" value="해당없음">해당없음</option>
                                </select>
							</td>
						</tr>   
			            <tr class="option-box tr_sort">
							<td class='td_sort' width=200>hot<b>*</b><span class="sound_only">필수</span></td>
							<td >
                                <select name="wr_link2" id="wr_link2" class="frm_input k_input k_input_sort" style="font-size: 1rem;">
                                    <option value="">hot을 선택하세요</option>
                                    <option id="1" value="hot">hot</option>
                                    <option id="2" value="해당없음">해당없음</option>
                                </select>
							</td>
						</tr>   


			            <tr class="option-box tr_sort">
							<td class='td_sort' width=200>ice<b>*</b><span class="sound_only">필수</span></td>
							<td >
                                <select name="wr_6" id="wr_6" class="frm_input k_input k_input_sort" style="font-size: 1rem;">
                                    <option value="">ice을 선택하세요</option>
                                    <option id="1" value="ice">ice</option>
                                    <option id="2" value="해당없음">해당없음</option>
                                </select>
							</td>
						</tr>   
                        

						<tr class="tr_sort">
							<td class='td_sort'>메뉴명<b>*</b><span class="sound_only"> 메뉴명 </span></td>
							<td><input type="text" name="wr_subject" value="<?php echo $subject ?>" id="wr_subject" required class="k_input_sort frm_input full_input required k_input k_input_w100" size="50" maxlength="255" placeholder="메뉴명을 입력해주세요."></td>
						</tr>
                        

                        
                        
						<tr class="tr_sort">
							<td class='td_sort'>메뉴명영문<b>*</b><span class="sound_only"> 메뉴명영문 </span></td>
							<td><input type="text" name="wr_2" value="<?php echo $wr_2 ?>" id="wr_2" required class="k_input_sort frm_input full_input required k_input k_input_w100" size="50" maxlength="255" placeholder="메뉴명영문을 입력해주세요."></td>
						</tr>     
						<tr class="tr_sort">
							<td class='td_sort'>메뉴설명<b>*</b><span class="sound_only"> 메뉴설명 </span></td>
							<td><input type="text" name="wr_content" value="<?php echo $content ?>" id="wr_content" required class="k_input_sort frm_input full_input required k_input k_input_w100" size="50" maxlength="255" placeholder="메뉴설명을 입력해주세요."></td>
						</tr>     
	            
                        <tr class="tr_sort">
                            <td>
                            <span style="display: block;font-size: .9rem;margin-top: 5px; color:red;white-space: nowrap;width: 0vw;">※ 파일은 5mb 이하로 업로드 해주세요.</span>
                                
                            </td>   
                        </tr>
								


						<?php for ($i=0; $is_file && $i<1; $i++) { ?>
						<tr class="tr_sort">
							<?php if($i == "0"){ ?>
								<td class='td_sort'>메뉴사진 #<?php echo $i+1 ?></td>
                            <?php }else{ ?>
								<td class='td_sort'>팝업사진 #<?php echo $i+1 ?></td>
							<? } ?>

							<td style='position:relative'>
								<input type="file" name="bf_file[]" title="파일첨부 <?php echo $i+1 ?> :  용량 <?php echo $upload_max_filesize ?> 이하만 업로드 가능" class="frm_file frm_input k_input_sort" class="k_input_sort frm_input full_input required k_input k_input_w100">
								<?php if ($is_file_content) { ?>
								<input type="text" name="bf_content[]" value="<?php echo ($w == 'u') ? $file[$i]['bf_content'] : ''; ?>" title="파일 설명을 입력해주세요." class="frm_file frm_input" >
								<?php } ?>
								<?php if($w == 'u' && $file[$i]['file']) { ?>
								<input style='position:absolute;bottom: 3%;' type="checkbox" id="bf_file_del<?php echo $i ?>" name="bf_file_del[<?php echo $i; ?>]" value="1" > <label  style='position:absolute;bottom: 3%;left: 108%;' for="bf_file_del<?php echo $i ?>"><?php echo $file[$i]['source'].'('.$file[$i]['size'].')'; ?> 파일 삭제</label>
								<?php } ?>
							</td>
						</tr>
						<?php } ?>
					</table>
				</div>

        
        
        



    <?php if ($is_use_captcha) { //자동등록방지  ?>
    <div class="write_div">
        <?php echo $captcha_html ?>
    </div>
    <?php } ?>


				<div class="k_new_btn_con">
					<div class="k_new_btn">
						<div class="k_btn_inner"><a href="./board.php?bo_table=<?php echo $bo_table ?>" class="k_btn_00">취소</a></div>
						<div class="k_btn_inner"><input type="submit" value="작성완료" id="btn_submit" accesskey="s" class="k_btn_00 k_btn_01"></div>
					</div>
				</div>
    </form>

    <script>
                $(".dessert_2nd_depth").hide();
        
        $("#wr_link1").val('<?php echo $write['wr_link1']; ?>').prop("selected", true);  
        $("#wr_link2").val('<?php echo $write['wr_link2']; ?>').prop("selected", true);  
        $("#wr_6").val('<?php echo $write['wr_6']; ?>').prop("selected", true);  
        $("#wr_4").val('<?php echo $write['wr_4']; ?>').prop("selected", true);  
        $("#wr_5").val('<?php echo $write['wr_5']; ?>').prop("selected", true);  
        
        
  $(".frm_file").on("change", function(){
    let maxSize = 5 * 1024 * 1024; //* 5MB 사이즈 제한
	let fileSize = this.files[0].size; //업로드한 파일용량

    if(fileSize > maxSize){
		alert("파일첨부 사이즈는 5MB 이내로 가능합니다.");
		$(this).val(''); //업로드한 파일 제거
		return; 
	}
  });        


            if($("#ca_name").val() == "dessert"){
                $('.dessert_2nd_depth').show();
                $('.cfbv_2nd_depth').hide();
                
            } else if($("#ca_name").val() == "coffee" || $("#ca_name").val() == "beverage") {
                $(".dessert_2nd_depth").hide();
                $('.cfbv_2nd_depth').show();

            } else {
                $(".dessert_2nd_depth").hide();
                $('.cfbv_2nd_depth').hide();
            }



        $("#ca_name").change(function(){
            // 변경된 값으로 비교 후 alert 표출
            if($(this).val() == "dessert"){
                $('.dessert_2nd_depth').show();
                $('.cfbv_2nd_depth').hide();
                
            } else if($(this).val() == "coffee" || $(this).val() == "beverage") {
                $(".dessert_2nd_depth").hide();
                $('.cfbv_2nd_depth').show();

            } else {
                $(".dessert_2nd_depth").hide();
                $('.cfbv_2nd_depth').hide();
            }
        });
        $("#ca_name option[value='공지']").remove();

    <?php if($write_min || $write_max) { ?>
    // 글자수 제한
    var char_min = parseInt(<?php echo $write_min; ?>); // 최소
    var char_max = parseInt(<?php echo $write_max; ?>); // 최대
    check_byte("wr_content", "char_count");

    $(function() {
        $("#wr_content").on("keyup", function() {
            check_byte("wr_content", "char_count");
        });
    });

    <?php } ?>
    function html_auto_br(obj)
    {
        if (obj.checked) {
            result = confirm("자동 줄바꿈을 하시겠습니까?\n\n자동 줄바꿈은 게시물 내용중 줄바뀐 곳을<br>태그로 변환하는 기능입니다.");
            if (result)
                obj.value = "html2";
            else
                obj.value = "html1";
        }
        else
            obj.value = "";
    }

    function fwrite_submit(f)
    {
        <?php echo $editor_js; // 에디터 사용시 자바스크립트에서 내용을 폼필드로 넣어주며 내용이 입력되었는지 검사함   ?>

        var subject = "";
        var content = "";
        $.ajax({
            url: g5_bbs_url+"/ajax.filter.php",
            type: "POST",
            data: {
                "subject": f.wr_subject.value,
                "content": f.wr_content.value
            },
            dataType: "json",
            async: false,
            cache: false,
            success: function(data, textStatus) {
                subject = data.subject;
                content = data.content;
            }
        });

        if (subject) {
            alert("제목에 금지단어('"+subject+"')가 포함되어있습니다");
            f.wr_subject.focus();
            return false;
        }

        if (content) {
            alert("내용에 금지단어('"+content+"')가 포함되어있습니다");
            if (typeof(ed_wr_content) != "undefined")
                ed_wr_content.returnFalse();
            else
                f.wr_content.focus();
            return false;
        }

        if (document.getElementById("char_count")) {
            if (char_min > 0 || char_max > 0) {
                var cnt = parseInt(check_byte("wr_content", "char_count"));
                if (char_min > 0 && char_min > cnt) {
                    alert("내용은 "+char_min+"글자 이상 쓰셔야 합니다.");
                    return false;
                }
                else if (char_max > 0 && char_max < cnt) {
                    alert("내용은 "+char_max+"글자 이하로 쓰셔야 합니다.");
                    return false;
                }
            }
        }

        <?php echo $captcha_js; // 캡챠 사용시 자바스크립트에서 입력된 캡챠를 검사함  ?>

        document.getElementById("btn_submit").disabled = "disabled";

        return true;
    }
    </script>
</section>
<!-- } 게시물 작성/수정 끝 -->
</div>
