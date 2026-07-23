import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("[Auto Downloader] Starting...")
    
    # 깃허브 시크릿(환경변수) 우선, 없으면 기본값 사용
    USER_ID = os.environ.get("TMS_USER_ID", "01082670779")
    USER_PW = os.environ.get("TMS_USER_PW", "01082670779")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True)
        page = await context.new_page()
        
        print("Navigating to login page...")
        await page.goto("https://tms.winionlogis.co.kr/main/main.do#")
        await page.wait_for_timeout(2000)
        
        print("Filling login info...")
        inputs = await page.locator("input").all()
        for i in inputs:
            type_val = await i.get_attribute("type")
            if type_val in ["text", "password"]:
                try:
                    await i.fill(USER_ID)
                except:
                    pass
        
        print("Clicking login button...")
        buttons = await page.locator("button, a, input[type='button'], input[type='submit']").all()
        for b in buttons:
            text = await b.inner_text()
            if text and ("로그인" in text or "LOGIN" in text.upper()):
                await b.click()
                break
        else:
            try:
                await page.click(".login_btn")
            except:
                pass

        print("Waiting for main page to load...")
        try:
            await page.wait_for_selector(".search-button", timeout=15000)
            print("Main page loaded successfully.")
        except Exception as e:
            print("Failed to find search button:", e)
            await browser.close()
            sys.exit(1)
            
        print("Clicking search button...")
        await page.click(".search-button")
        
        print("Waiting for data to load...")
        await page.wait_for_timeout(10000)
        
        print("Initiating Excel download...")
        try:
            async with page.expect_download(timeout=15000) as download_info:
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
            await browser.close()
            sys.exit(1)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
