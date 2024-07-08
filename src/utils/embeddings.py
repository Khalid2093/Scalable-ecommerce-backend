
# //python funtion to print hello world and export it
def export_hello_world():
    with open('/d:/Projects/e-commerce_mern_backend/src/utils/hello_world.txt', 'w') as file:
        file.write("Hello World!")
    print("Hello World!")
    return "Hello World!"

def hello_world():
    print("Hello World!")   
    return "Hello World!"
