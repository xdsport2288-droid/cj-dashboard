import tkinter as tk
import sys

def show_toast(title, message):
    root = tk.Tk()
    root.overrideredirect(True) # Remove window decorations
    root.attributes('-topmost', True) # Keep on top
    
    # Set background and text colors
    bg_color = "#333333"
    fg_color = "#ffffff"
    root.configure(bg=bg_color)
    
    # Calculate screen width and height
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    
    # Window dimensions
    window_width = max(300, min(len(message) * 11 + 40, 500))
    window_height = 80
    
    # Position bottom right with some margin
    x_pos = screen_width - window_width - 20
    y_pos = screen_height - window_height - 60 # Above taskbar
    
    root.geometry(f"{window_width}x{window_height}+{x_pos}+{y_pos}")
    
    # Add title and message
    tk.Label(root, text=title, font=("Arial", 10, "bold"), bg=bg_color, fg="#48bb78", anchor="w", padx=10, pady=5).pack(fill="x")
    tk.Label(root, text=message, font=("Arial", 9), bg=bg_color, fg=fg_color, anchor="w", padx=10, justify="left").pack(fill="x")
    
    # Close after 3000ms
    root.after(3000, root.destroy)
    
    # Optional: Fade out effect
    def fade_out():
        alpha = root.attributes("-alpha")
        if alpha > 0:
            alpha -= 0.1
            root.attributes("-alpha", alpha)
            root.after(50, fade_out)
        else:
            root.destroy()
            
    root.after(2500, fade_out)
    
    root.mainloop()

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        show_toast(sys.argv[1], sys.argv[2])
