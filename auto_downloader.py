import asyncio
import os
import sys
import datetime
from playwright.async_api import async_playwright

async def main():
    print("[Auto Downloader] Starting...")
    
    # 깃허브 시크릿(환경변수) 우선, 값이 비어있으면 기본값(사용자 전화번호) 사용
    USER_ID = os.environ.get("TMS_USER_ID") or "01082670779"
    USER_PW = os.environ.get("TMS_USER_PW") or "01082670779"
    
    async with async_playwright() as p:
        # 뷰포트 크기를 PC 화면처럼 크게 설정
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            accept_downloads=True,
            viewport={'width': 1920, 'height': 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        print("Navigating to login page...")
        await page.goto("https://tms.winionlogis.co.kr/main/main.do#")
        await page.wait_for_timeout(3000)
        
        print("Filling login info...")
        try:
            # ID 입력창이 나타날 때까지 확실하게 대기 (최대 30초)
            await page.wait_for_selector("#inputId", timeout=30000)
            await page.fill("#inputId", USER_ID)
            await page.fill("#inputPwd", USER_PW)
        except Exception as e:
            print("Failed to find login inputs:", e)
            await page.screenshot(path="error_screenshot.png", full_page=True)
            sys.exit(1)
        
        print("Clicking login button...")
        try:
            # 로그인 버튼 클래스를 클릭
            await page.click(".login_btn", timeout=10000)
        except:
            # 혹시 버튼 클래스가 다를 경우 fallback
            buttons = await page.locator("button, a, input[type='button'], input[type='submit']").all()
            for b in buttons:
                text = await b.inner_text()
                if text and ("로그인" in text or "LOGIN" in text.upper()):
                    await b.click()
                    break

        print("Waiting for main page to load...")
        try:
            # 타임아웃을 25초로 늘림
            await page.wait_for_selector(".search-button", timeout=25000)
            print("Main page loaded successfully.")
        except Exception as e:
            print("Failed to find search button:", e)
            await page.screenshot(path="error_screenshot.png", full_page=True)
            print("Saved error_screenshot.png for debugging.")
            await browser.close()
            sys.exit(1)
            
        print("Setting start date to 1st of previous month...")
        try:
            today = datetime.date.today()
            first_day_this_month = today.replace(day=1)
            last_day_prev_month = first_day_this_month - datetime.timedelta(days=1)
            first_day_prev_month = last_day_prev_month.replace(day=1).strftime('%Y-%m-%d')
            
            date_inputs = await page.locator("input[type='date']").all()
            if len(date_inputs) >= 1:
                await date_inputs[0].fill(first_day_prev_month)
                print(f"Set start date to: {first_day_prev_month}")
        except Exception as e:
            print("Failed to set date:", e)
            
        print("Clicking search button...")
        try:
            await page.click(".search-button")
        except Exception as e:
            print("Failed to click search button:", e)
            await page.screenshot(path="error_screenshot.png", full_page=True)
            sys.exit(1)
        
        print("Waiting for data to load...")
        await page.wait_for_timeout(10000)
        
        print("Initiating Excel download...")
        try:
            async with page.expect_download(timeout=25000) as download_info:
                await page.click("#exceldownBtn")
                
            download = await download_info.value
            file_path = os.path.join(os.getcwd(), "dashboard_data_new.xlsx")
            
            print(f"Saving file to: {file_path}")
            await download.save_as(file_path)
            print("Download completed successfully!")
            
            if os.path.exists("dashboard_data.xlsx"):
                os.replace("dashboard_data_new.xlsx", "dashboard_data.xlsx")
            else:
                os.rename("dashboard_data_new.xlsx", "dashboard_data.xlsx")
            print("Replaced dashboard_data.xlsx with new data.")
            
        except Exception as e:
            print("Download failed:", e)
            await page.screenshot(path="error_screenshot.png", full_page=True)
            await browser.close()
            sys.exit(1)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
