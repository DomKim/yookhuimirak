<?php
require_once './_common.php';
require_once G5_LIB_PATH . '/mailer.lib.php';

if ($_POST['tel1'] !='') {
    $name       = $_POST['name'];
    $tel1       = $_POST['tel1'];
    $area       = $_POST['area'];
    $budget   = $_POST['budget'];
    $wr_2   = $_POST['wr_2'];
    $wr_3   = $_POST['wr_3'];
    $form_index = $_POST['form_index'];
    $message    = $_POST['message']; // textarea 입력 값 (문의내용)

    $title = '스트릿츄러스 입점 제안 문의';

    $content = '
    <div style="font-family:\'Segoe UI\',Arial,sans-serif; max-width:650px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(50,53,205,0.15);">

      <!-- 헤더 -->
      <div style="background:#3235cd; color:#fff; padding:24px; text-align:center;">
        <h2 style="margin:0; font-size:22px; letter-spacing:1px;">스트릿츄러스</h2>
        <p style="margin:6px 0 0; font-size:14px; opacity:0.9;">입점 제안 문의 접수 알림</p>
      </div>

      <!-- 본문 -->
      <div style="padding:28px;">
        <div style="margin-bottom:16px; padding:14px 18px; background:#eaebff; border-radius:8px;">
          <span style="display:block; font-size:12px; font-weight:bold; color:#3235cd; margin-bottom:6px;">성함</span>
          <span style="font-size:15px; color:#222;">'.$name.'</span>
        </div>

        <div style="margin-bottom:16px; padding:14px 18px; background:#f9f9ff; border-radius:8px;">
          <span style="display:block; font-size:12px; font-weight:bold; color:#3235cd; margin-bottom:6px;">연락처</span>
          <span style="font-size:15px; color:#222;">'.$tel1.'</span>
        </div>

        <div style="margin-bottom:16px; padding:14px 18px; background:#eaebff; border-radius:8px;">
          <span style="display:block; font-size:12px; font-weight:bold; color:#3235cd; margin-bottom:6px;">상가유무</span>
          <span style="font-size:15px; color:#222;">'.$budget.'</span>
        </div>

        <div style="margin-bottom:16px; padding:14px 18px; background:#f9f9ff; border-radius:8px;">
          <span style="display:block; font-size:12px; font-weight:bold; color:#3235cd; margin-bottom:6px;">입점제안위치</span>
          <span style="font-size:15px; color:#222;">'.$area.'</span>
        </div>

        <div style="margin-bottom:16px; padding:14px 18px; background:#eaebff; border-radius:8px;">
          <span style="display:block; font-size:12px; font-weight:bold; color:#3235cd; margin-bottom:6px;">이메일</span>
          <span style="font-size:15px; color:#222;">'.$wr_2.'</span>
        </div>

        <div style="margin-bottom:16px; padding:14px 18px; background:#f9f9ff; border-radius:8px;">
          <span style="display:block; font-size:12px; font-weight:bold; color:#3235cd; margin-bottom:6px;">제목</span>
          <span style="font-size:15px; color:#222; white-space:pre-line;">'.$wr_3.'</span>
        </div>

        <div style="margin-bottom:16px; padding:14px 18px; background:#eaebff; border-radius:8px;">
          <span style="display:block; font-size:12px; font-weight:bold; color:#3235cd; margin-bottom:6px;">문의내용</span>
          <span style="font-size:15px; color:#222;">'.$form_index.'</span>
        </div>

        <p style="margin-top:24px; font-size:12px; color:#777; text-align:center; border-top:1px dashed #eaebff; padding-top:12px;">
          ※ 본 메일은 자동 발송된 안내 메일입니다. 
        </p>
      </div>

      <!-- 푸터 -->
      <div style="background:#3235cd; color:#fff; padding:16px; text-align:center; font-size:12px;">
        (주)브이웍스 | 문의 : vworks02@naver.com
      </div>
    </div>';

// 파일이 정상 업로드 확인
if (isset($_FILES['attachment']) && $_FILES['attachment']['error'][0] === UPLOAD_ERR_OK) {
    $attachments = [];
    foreach ($_FILES['attachment']['tmp_name'] as $index => $tmp_name) {
        $attachments[] = [
            'path' => $tmp_name,
            'name' => $_FILES['attachment']['name'][$index]
        ];
    }
    // 여러 개의 첨부파일 처리

    mailer($name, 'vworks02@streetchurros01.mycafe24.com', 'rbska98@naver.com', $title , $content , 1, $attachments);
} else {
    // 첨부파일 없을 경우
    mailer($name, 'vworks02@streetchurros01.mycafe24.com', 'rbska98@naver.com', $title , $content , 1);
}

    // DB 저장
    $sql = " insert into g5_email_data2
        set name   = '$name',
            phone   = '$tel1',
            location= '$area',
            budget  = '$budget',
            wr_2  = '$wr_2',
            wr_3  = '$wr_3',
            content = '$form_index'";
            
    sql_query($sql);
}
